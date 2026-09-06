const cron = require('node-cron');
const Member = require('../models/Member');
const Gym = require('../models/Gym');
const Notification = require('../models/Notification');
const { sendPushNotification, isFCMAvailable } = require('../services/fcmService');

/**
 * Renewal Reminder Cron Jobs
 *
 * Schedule: Runs ONCE daily at 7:00 PM IST (prime time — members are home from work)
 *
 * Reminder series — ALL use full-screen lock-screen popup (like MyGate):
 *  - 2 days before expiry : Full-screen popup, amber color, double vibrate
 *  - 1 day before expiry  : Full-screen popup, orange color, strong vibrate
 *  - Expiry day           : Full-screen popup, RED color, ring vibration
 *
 * All 3 show on the lock screen even if phone is sleeping.
 * Uses cursor-based pagination to process members in batches of 100.
 * Each reminder fires only ONCE per member per event (idempotency check).
 */

const REMINDER_SCHEDULE = [
    {
        daysOffset: 2,        // 2 days BEFORE expiry
        direction: 'before',
        title: '⏰ Membership Expires in 2 Days',
        message: 'Your membership is expiring soon. Contact your gym to renew and keep your streak alive! 💪',
        tone: 'urgent',
        // ALL reminders now use 'critical' → full-screen popup visible on lock screen.
        // The channel importance (IMPORTANCE_HIGH/MAX) controls the popup behaviour.
        // Colour differentiation happens inside fcmService based on tone.
        fcmPriority: 'critical'
    },
    {
        daysOffset: 1,        // 1 day BEFORE expiry (tomorrow is the last day)
        direction: 'before',
        title: '⚠️ Last Day Tomorrow — Renew Now!',
        message: 'Your gym membership expires TOMORROW. Renew today to avoid losing access!',
        tone: 'last_chance',
        fcmPriority: 'critical'
    },
    {
        daysOffset: 0,        // Expiry day itself
        direction: 'before',
        title: '🔴 Membership Expires TODAY',
        message: 'Today is your last day! Renew immediately to keep your gym access active. Tap to view plans.',
        tone: 'last_chance',
        fcmPriority: 'critical'
    }
];

/**
 * Process a single reminder type across all qualifying members.
 * Uses cursor-based pagination (batch of 100) per BRD Section 15.3.
 */
const processReminder = async (reminder) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetDateStartVar, targetDateEndVar;

    if (reminder.direction === 'before') {
        // For "before expiry" reminders, add a 1-day recovery window
        const targetDateEnd = new Date(today);
        targetDateEnd.setDate(targetDateEnd.getDate() + reminder.daysOffset);
        targetDateEnd.setHours(23, 59, 59, 999);

        const targetDateStart = new Date(today);
        // Look back 1 extra day for recovery
        targetDateStart.setDate(targetDateStart.getDate() + reminder.daysOffset - 1);
        targetDateStart.setHours(0, 0, 0, 0);
        
        targetDateStartVar = targetDateStart;
        targetDateEndVar = targetDateEnd;
    } else {
        // For "after expiry" reminders, add a 1-day recovery window
        const targetDateStart = new Date(today);
        targetDateStart.setDate(targetDateStart.getDate() - reminder.daysOffset - 1);
        targetDateStart.setHours(0, 0, 0, 0);

        const targetDateEnd = new Date(today);
        targetDateEnd.setDate(targetDateEnd.getDate() - reminder.daysOffset);
        targetDateEnd.setHours(23, 59, 59, 999);
        
        targetDateStartVar = targetDateStart;
        targetDateEndVar = targetDateEnd;
    }

    const query = {
        expiryDate: { $gte: targetDateStartVar, $lte: targetDateEndVar },
        status: { $ne: 'Inactive' }, // Skip stopped members
        registrationStatus: 'approved',
        'notificationPreferences.renewalReminders': { $ne: false } // Respect user preference
    };

    const BATCH_SIZE = 100;
    let lastId = null;
    let totalProcessed = 0;

    while (true) {
        // Cursor-based pagination
        const batchQuery = lastId 
            ? { ...query, _id: { $gt: lastId } }
            : query;

        const members = await Member.find(batchQuery)
            .select('_id name gym fcmTokens')
            .sort({ _id: 1 })
            .limit(BATCH_SIZE)
            .lean();

        if (members.length === 0) break;

        // Process each member in the batch
        for (const member of members) {
            try {
                // Check if we already sent this reminder recently (within last 3 days)
                const threeDaysAgo = new Date(today);
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

                const existingNotification = await Notification.findOne({
                    recipient: member._id,
                    recipientType: 'Member',
                    type: 'renewal_reminder',
                    title: reminder.title,
                    createdAt: { $gte: threeDaysAgo }
                }).lean();

                if (existingNotification) continue;

                // Create in-app notification
                const notif = await Notification.create({
                    recipient: member._id,
                    recipientType: 'Member',
                    gym: member.gym,
                    title: reminder.title,
                    message: reminder.message,
                    type: 'renewal_reminder',
                    referenceId: member._id,
                    referenceModel: 'Member'
                });

                // Send FCM push notification (best-effort)
                // fcmPriority routes the notification to the correct Android channel:
                //   'critical' → renewal_critical  (full-screen popup, ring+vibrate like MyGate)
                //   'urgent'   → renewal_urgent     (heads-up banner + vibrate)
                if (isFCMAvailable() && member.fcmTokens && member.fcmTokens.length > 0) {
                    const tokens = member.fcmTokens.map(t => t.token || t);
                    for (const token of tokens) {
                        await sendPushNotification(token, reminder.title, reminder.message, {
                            type: 'renewal_reminder',
                            tone: reminder.tone,
                            fcmPriority: reminder.fcmPriority || 'default', // ← routes to correct channel
                            link: `/member/plans?notifId=${notif._id}&action=clicked`,
                            notificationId: notif._id.toString()
                        });
                    }
                }

                totalProcessed++;
            } catch (err) {
                console.error(`[CRON] Reminder failed for member ${member._id}:`, err.message);
            }
        }

        lastId = members[members.length - 1]._id;

        // If we got fewer than batch size, we're done
        if (members.length < BATCH_SIZE) break;
    }

    return totalProcessed;
};

// Overlap prevention flags — ensures a slow run does not trigger a second parallel run
let isReminderRunning = false;
let isExpiredUpdateRunning = false;

/**
 * Run all renewal reminders
 * Guards against overlap: if a previous run is still active, the new run is skipped.
 */
const runRenewalReminders = async () => {
    if (isReminderRunning) {
        console.warn('[CRON] Renewal reminder job skipped — previous run still active.');
        return;
    }

    isReminderRunning = true;
    console.log('[CRON] Starting renewal reminder job...');
    const startTime = Date.now();

    let totalNotifications = 0;

    try {
        for (const reminder of REMINDER_SCHEDULE) {
            try {
                const count = await processReminder(reminder);
                totalNotifications += count;
                if (count > 0) {
                    console.log(`[CRON] ${reminder.title}: ${count} notifications sent`);
                }
            } catch (err) {
                console.error(`[CRON] Reminder "${reminder.title}" failed:`, err.message);
            }
        }
    } finally {
        isReminderRunning = false;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[CRON] Renewal reminders complete: ${totalNotifications} total notifications in ${elapsed}s`);
    }
};

/**
 * Daily expired membership status updater
 * Marks members as Expired if their expiry date has passed
 */
const updateExpiredMemberships = async () => {
    if (isExpiredUpdateRunning) {
        console.warn('[CRON] Expired membership updater skipped — previous run still active.');
        return;
    }

    isExpiredUpdateRunning = true;
    try {
        const today = new Date();
        const result = await Member.updateMany(
            {
                expiryDate: { $lt: today },
                status: 'Active',
                registrationStatus: 'approved'
            },
            { status: 'Expired' }
        );

        if (result.modifiedCount > 0) {
            console.log(`[CRON] Updated ${result.modifiedCount} members to Expired status`);
        }
    } catch (err) {
        console.error('[CRON] Expired membership update failed:', err.message);
    } finally {
        isExpiredUpdateRunning = false;
    }
};

/**
 * Start all renewal-related cron jobs
 */
const startRenewalCronJobs = () => {
    // Run renewal reminders ONCE daily at 7:00 PM IST
    // Evening is peak engagement time — members are home, thinking about gym tomorrow.
    // 3 reminders total: 2-day before, 1-day before, expiry day. Clean. Not spammy.
    cron.schedule('0 19 * * *', async () => {
        try {
            await runRenewalReminders();
        } catch (err) {
            console.error('[CRON] Renewal reminder cron failed:', err.message);
        }
    }, {
        timezone: 'Asia/Kolkata'
    });

    // Run expired membership updater daily at 12:01 AM (IST)
    // Marks members as Expired so the app shows the expiry screen immediately at midnight.
    cron.schedule('1 0 * * *', async () => {
        try {
            await updateExpiredMemberships();
        } catch (err) {
            console.error('[CRON] Expired membership cron failed:', err.message);
        }
    }, {
        timezone: 'Asia/Kolkata'
    });

    console.log('[CRON] Renewal reminders scheduled — 7:00 PM IST daily (2-day, 1-day, expiry-day)');
    console.log('[CRON] Expired membership updater scheduled — 12:01 AM IST daily');
};

module.exports = { startRenewalCronJobs, runRenewalReminders, updateExpiredMemberships };
