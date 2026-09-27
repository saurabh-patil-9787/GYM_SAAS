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

        // ─── Select Android notification channel based on priority ─────────────────
        // 'critical' → renewal_critical channel (IMPORTANCE_HIGH → full-screen popup on lock screen)
        //              All 3 renewal reminders use this channel so they ALL pop up on lock screen.
        // (default)  → trackon_default channel (standard notifications for other types)
        const fcmPriority = data.fcmPriority || 'default';
        const tone = data.tone || 'default';

        const androidChannelId = fcmPriority === 'critical'
            ? 'renewal_critical'
            : 'trackon_default';

        // Color changes per tone to give visual differentiation across the 3 reminders:
        //  urgent     (2-day before) → amber  #f59e0b  — "heads up, time to think"
        //  last_chance(1-day + today)→ red    #ef4444  — "urgent action required"
        //  default                   → indigo #6366f1
        const notifColor = tone === 'last_chance'
            ? '#ef4444'
            : tone === 'urgent'
                ? '#f59e0b'
                : '#6366f1';

        // All critical notifications: strong ring-style vibration
        // Other notifications: gentle single pulse
        const vibratePattern = fcmPriority === 'critical'
            ? [0, 400, 200, 400, 200, 400]   // long–short–long, like a phone ring
            : [0, 200, 100, 200];

        const message = {
            token: fcmToken,
            notification: {
                title,
                body
            },
            data: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            ),
            // Android — channel-aware notification routing
            android: {
                notification: {
                    icon: 'ic_stat_notification',
                    color: notifColor,
                    sound: 'default',
                    channelId: androidChannelId,
                    priority: 'high',
                    vibrateTimingsMillis: vibratePattern,
                    // PUBLIC = show full content on lock screen (even when phone is asleep)
                    // This is the key that makes it visible on locked screen like MyGate
                    visibility: fcmPriority === 'critical' ? 'PUBLIC' : 'PRIVATE',
                    defaultVibrateTimings: false
                },
                priority: 'high'   // FCM transport priority (always HIGH for immediate delivery)
            },
            // Web push (Chrome on desktop / laptop browsers)
            webpush: {
                headers: {
                    Urgency: fcmPriority === 'critical' ? 'very-high' : 'high',
                    TTL: '86400'
                },
                notification: {
                    icon: '/android-chrome-192x192.png',
                    badge: '/favicon-32x32.png',
                    vibrate: fcmPriority === 'critical'
                        ? [400, 200, 400, 200, 400]
                        : [200, 100, 200, 100, 200],
                    renotify: true,
                    // requireInteraction=true keeps the notification visible until user taps it
                    // This is what makes it feel like MyGate \u2014 it won\u2019t auto-dismiss
                    requireInteraction: fcmPriority === 'critical',
                    tag: data.type || 'trackon'
                },
                fcmOptions: {
                    link: data.link || getDeepLinkForType(data.type) || '/'
                }
            },
            // APNS (iOS Safari PWA)
            apns: {
                payload: {
                    aps: {
                        sound: fcmPriority === 'critical' ? 'default' : 'default',
                        badge: 1,
                        // interruptionLevel: 'critical' on iOS 15+ overrides Focus/DND
                        // 'time-sensitive' is the max level available without Apple entitlement
                        'interruption-level': fcmPriority === 'critical' ? 'time-sensitive' : 'active'
                    }
                },
                headers: {
                    // High APNS priority (immediate delivery, not batched)
                    'apns-priority': '10'
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
