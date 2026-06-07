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
        // 1. Create in-app notification (always)
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
                    const member = await Member.findById(recipientId).select('fcmTokens').lean();
                    fcmTokens = member?.fcmTokens || [];
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
