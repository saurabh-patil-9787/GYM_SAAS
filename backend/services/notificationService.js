/**
 * Unified Notification Service
 * Creates in-app notifications AND triggers FCM push delivery.
 * This is the single entry point for all notification creation.
 */

const Notification = require('../models/Notification');
const Member = require('../models/Member');
const GymOwner = require('../models/GymOwner');
const { sendPushNotification, sendPushToMultiple, isFCMAvailable } = require('./fcmService');

// ─── Deep-link map (must match service worker getLinkFromType) ────────────────
// All keys MUST be valid Notification model enum values
const getLinkFromType = (type) => {
    switch (type) {
        // Owner receives → open owner dashboard
        case 'new_registration_request': return '/dashboard';
        case 'fresh_start_request':      return '/dashboard';
        case 'member_stopped':           return '/dashboard';
        case 'member_rejoined':          return '/dashboard';
        case 'online_payment_received':  return '/dashboard';

        // Member receives → open relevant member screen
        case 'registration_approved':    return '/member/dashboard';
        case 'registration_rejected':    return '/member/dashboard';
        case 'fresh_start_approved':     return '/member/dashboard';
        case 'fresh_start_rejected':     return '/member/dashboard';
        case 'renewal_approved':         return '/member/dashboard';
        case 'membership_expired':       return '/member/dashboard';
        case 'payment_recorded':         return '/member/transactions';
        case 'renewal_reminder':         return '/member/plans';

        default: return '/';
    }
};

/**
 * Notification types that are ALWAYS delivered via FCM push, even when
 * the member's plan has expired. These are actionable — they help the
 * member know they can renew or that their status has changed.
 *
 * All other types (gym_announcement, gymDayReminder, waterReminder, etc.)
 * are silenced for expired members to prevent spamming inactive users.
 */
const CRITICAL_TYPES_FOR_EXPIRED = [
    'renewal_approved',       // Plan renewed — portal access restored
    'renewal_reminder',       // Cron reminder to renew (important for expired too)
    'fresh_start_approved',   // Fresh start request approved
    'fresh_start_rejected',   // Fresh start request rejected
    'registration_approved',  // Registration approved
    'registration_rejected',  // Registration rejected
    'membership_expired',     // Expiry notification itself
    'payment_recorded',       // Payment recorded by owner
];

/**
 * Create an in-app notification and optionally send FCM push
 * @param {Object} params
 * @param {string} params.recipientId - ID of the recipient (member or owner)
 * @param {string} params.recipientType - 'Member' or 'GymOwner'
 * @param {string} params.gymId - Gym ID
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.type - Notification type enum
 * @param {string} [params.referenceId] - Optional reference ID
 * @param {string} [params.referenceModel] - Optional reference model
 * @param {boolean} [params.sendPush=true] - Whether to also send FCM push
 * @param {Object} [params.pushData] - Extra data for push notification
 * @returns {Promise<Object>} - Created notification document
 */
const createNotification = async ({
    recipientId,
    recipientType,
    gymId,
    title,
    message,
    type,
    referenceId = null,
    referenceModel = null,
    sendPush = true,
    pushData = {}
}) => {
    try {
        // 1. Always create the in-app notification — even for expired members.
        //    They can see it via the notification bell on the expired block page.
        const notification = await Notification.create({
            recipient: recipientId,
            recipientType,
            gym: gymId,
            title,
            message,
            type,
            referenceId,
            referenceModel
        });

        // 2. Attempt FCM push delivery (best-effort)
        if (sendPush && isFCMAvailable()) {
            try {
                let fcmTokens = [];

                if (recipientType === 'Member') {
                    // Fetch FCM tokens AND expiryDate in one query for efficiency
                    const member = await Member.findById(recipientId).select('fcmTokens expiryDate').lean();
                    fcmTokens = member?.fcmTokens || [];

                    // ── Plan expiry guard ────────────────────────────────────
                    // If the member's plan has expired, suppress FCM push for
                    // non-critical notification types. The in-app notification
                    // was already created (step 1) and is readable via the bell.
                    // Renewal reminders and approval notifications bypass this
                    // check so members are prompted to renew.
                    const isExpired = member?.expiryDate && new Date(member.expiryDate) < new Date();
                    if (isExpired && !CRITICAL_TYPES_FOR_EXPIRED.includes(type)) {
                        return notification; // In-app created; FCM skipped for expired member
                    }
                } else if (recipientType === 'GymOwner') {
                    const owner = await GymOwner.findById(recipientId).select('fcmTokens').lean();
                    fcmTokens = owner?.fcmTokens || [];
                }

                if (fcmTokens.length > 0) {
                    const tokens = fcmTokens.map(t => t.token || t);
                    await sendPushToMultiple(tokens, title, message, {
                        notificationId: notification._id.toString(),
                        type,
                        link: getLinkFromType(type),
                        ...pushData
                    });
                }
            } catch (pushErr) {
                // Push failure should never block in-app notification
                console.error('[NotificationService] FCM push failed (in-app notification still created):', pushErr.message);
            }
        }

        return notification;
    } catch (error) {
        console.error('[NotificationService] Failed to create notification:', error.message);
        throw error;
    }
};

module.exports = { createNotification };
