/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notification delivery to member and owner devices.
 * 
 * SETUP REQUIRED:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Go to Project Settings > Service Accounts > Generate new private key
 * 3. Save the JSON file as backend/config/firebaseServiceAccountKey.json
 * 4. Set FIREBASE_PROJECT_ID in .env
 */

let admin = null;
let fcmInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Called once at server startup
 */
const initializeFCM = () => {
    try {
        // Only initialize if credentials are available
        const projectId = process.env.FIREBASE_PROJECT_ID;
        if (!projectId) {
            console.warn('[FCM] FIREBASE_PROJECT_ID not set — push notifications disabled');
            return false;
        }

        const firebaseAdmin = require('firebase-admin');
        let credential;

        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            // Option 1: Use .env variables directly (great for production/Vercel/Render)
            credential = firebaseAdmin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
        } else {
            // Option 2: Fallback to local JSON file
            try {
                const serviceAccount = require('../config/firebaseServiceAccountKey.json');
                credential = firebaseAdmin.credential.cert(serviceAccount);
            } catch (e) {
                console.warn('[FCM] Firebase credentials not found in .env or config file — push notifications disabled');
                return false;
            }
        }
        
        if (!firebaseAdmin.apps.length) {
            admin = firebaseAdmin.initializeApp({
                credential: credential,
                projectId: projectId
            });
        } else {
            admin = firebaseAdmin.app();
        }

        fcmInitialized = true;
        console.log('[FCM] Firebase Admin SDK initialized successfully');
        return true;
    } catch (error) {
        console.error('[FCM] Failed to initialize Firebase Admin SDK:', error.message);
        return false;
    }
};

/**
 * Send push notification to a single device token
 * @param {string} fcmToken - The device FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!fcmInitialized || !admin) {
        console.log('[FCM] Not initialized — skipping push notification');
        return false;
    }

    if (!fcmToken) return false;

    // ─── Derive deep-link from notification type (for webpush fcmOptions.link) ───
    const typeToLink = {
        renewal_reminder: '/member/plans',
        payment_recorded: '/member/transactions',
        renewal_approved: '/member/plans',
        renewal_rejected: '/member/plans',
        fresh_start_approved: '/member/plans',
        fresh_start_rejected: '/member/plans',
        registration_approved: '/member/dashboard',
        registration_rejected: '/member/find-gym',
        new_member_registration: '/dashboard/members',
        new_renewal_request: '/dashboard/members',
        payment_pending: '/dashboard/members',
        member_stopped: '/dashboard/members',
        member_rejoined: '/dashboard/members',
        // Habit reminders
        water_reminder: '/member/fitness/water-tracker',
        measurementReminder: '/member/fitness/body-progress',
        weeklyGoalCheckin: '/member/fitness/goals',
        gymDayReminder: '/member/dashboard'
    };
    const getDeepLinkForType = (type) => typeToLink[type] || null;

    try {
        const firebaseAdmin = require('firebase-admin');
        const message = {
            token: fcmToken,
            notification: {
                title,
                body
            },
            data: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            ),
            // Android: uses default notification channel with sound
            android: {
                notification: {
                    icon: 'ic_stat_trackon',
                    color: '#6366f1',
                    sound: 'default',
                    channelId: 'trackon_default',
                    priority: 'high',
                    vibrateTimingsMillis: [0, 200, 100, 200]  // must be number[] per FCM Admin SDK
                },
                priority: 'high'
            },
            // Web push (Chrome on desktop/laptop)
            webpush: {
                headers: {
                    Urgency: "high",
                    TTL: "86400"
                },
                notification: {
                    icon: '/android-chrome-192x192.png',
                    badge: '/favicon-32x32.png',
                    vibrate: [200, 100, 200, 100, 200],
                    renotify: true,
                    requireInteraction: false,
                    tag: data.type || 'trackon'
                },
                fcmOptions: {
                    // Deep-link: prefer explicit link, else derive from type
                    link: data.link || getDeepLinkForType(data.type) || '/'
                }
            },
            // APNS (iOS Safari PWA)
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1
                    }
                }
            }
        };

        const response = await firebaseAdmin.messaging().send(message);
        console.log('[FCM] Push sent successfully:', response);
        
        try {
            const NotificationAuditLog = require('../models/NotificationAuditLog');
            await NotificationAuditLog.create({
                fcmToken,
                title,
                body,
                status: 'sent'
            });
        } catch (logErr) {
            console.error('[FCM] Failed to write audit log:', logErr.message);
        }
        
        return true;
    } catch (error) {
        // Handle invalid/expired tokens
        if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
        ) {
            console.log('[FCM] Invalid token — should be removed:', fcmToken.substring(0, 20) + '...');
            
            try {
                const Member = require('../models/Member');
                const GymOwner = require('../models/GymOwner');
                await Member.updateMany(
                    { "fcmTokens.token": fcmToken },
                    { $pull: { fcmTokens: { token: fcmToken } } }
                );
                await GymOwner.updateMany(
                    { "fcmTokens.token": fcmToken },
                    { $pull: { fcmTokens: { token: fcmToken } } }
                );
                
                const NotificationAuditLog = require('../models/NotificationAuditLog');
                await NotificationAuditLog.create({
                    fcmToken,
                    title,
                    body,
                    status: 'invalid_token',
                    error: error.code
                });
                
                console.log('[FCM] Invalid token removed from DB');
            } catch (dbErr) {
                console.error('[FCM] Error removing invalid token from DB:', dbErr.message);
            }
            
            return false;
        }
        console.error('[FCM] Send error:', error.message);
        try {
            const NotificationAuditLog = require('../models/NotificationAuditLog');
            await NotificationAuditLog.create({
                fcmToken,
                title,
                body,
                status: 'failed',
                error: error.message
            });
        } catch (logErr) {}
        
        return false;
    }
};

/**
 * Send push notification to multiple device tokens
 * @param {string[]} fcmTokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 * @returns {Promise<{success: number, failure: number, invalidTokens: string[]}>}
 */
const sendPushToMultiple = async (fcmTokens, title, body, data = {}) => {
    if (!fcmInitialized || !admin) {
        return { success: 0, failure: 0, invalidTokens: [] };
    }

    if (!fcmTokens || fcmTokens.length === 0) {
        return { success: 0, failure: 0, invalidTokens: [] };
    }

    // Filter out empty tokens
    const validTokens = fcmTokens.filter(t => t && typeof t === 'string');
    if (validTokens.length === 0) {
        return { success: 0, failure: 0, invalidTokens: [] };
    }

    const results = { success: 0, failure: 0, invalidTokens: [] };

    // Process in batches of 500 (FCM limit)
    const batchSize = 500;
    for (let i = 0; i < validTokens.length; i += batchSize) {
        const batch = validTokens.slice(i, i + batchSize);
        const promises = batch.map(async (token) => {
            const sent = await sendPushNotification(token, title, body, data);
            if (sent) {
                results.success++;
            } else {
                results.failure++;
                results.invalidTokens.push(token);
            }
        });
        await Promise.allSettled(promises);
    }

    return results;
};

/**
 * Check if FCM is available
 */
const isFCMAvailable = () => fcmInitialized;

module.exports = {
    initializeFCM,
    sendPushNotification,
    sendPushToMultiple,
    isFCMAvailable
};
