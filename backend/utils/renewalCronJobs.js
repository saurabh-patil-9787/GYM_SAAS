const cron = require('node-cron');
const Member = require('../models/Member');
const Gym = require('../models/Gym');
const Notification = require('../models/Notification');
const { sendPushNotification, isFCMAvailable } = require('../services/fcmService');

/**
 * Renewal Reminder Cron Jobs
 * 
 * Schedule: Runs daily at 9:00 AM IST
 * 
 * Reminder series per BRD Section 11.2:
 * - 5 days before expiry: Friendly reminder
 * - 1 day before expiry: Urgent reminder
 * - Expiry day: Last chance
 * - 2 days after expiry: Win-back
 * - 4 days after expiry: Win-back
 * - 6 days after expiry: Final reminder
 * 
 * Uses cursor-based pagination to process members in batches of 100.
 */

const REMINDER_SCHEDULE = [
    {
        daysOffset: 5, // 5 days BEFORE expiry
        direction: 'before',
        title: 'Membership Expiring Soon ⏰',
        message: 'Your gym membership expires in 5 days. Renew now to continue your fitness journey!',
        tone: 'friendly'
    },
    {
        daysOffset: 3, // 3 days BEFORE expiry
        direction: 'before',
        title: 'Gym Membership Renewal Reminder ⏰',
        message: 'Your gym membership expires in 3 days. Keep up the momentum, renew today!',
        tone: 'reminder'
    },
    {
        daysOffset: 1, // 1 day BEFORE expiry
        direction: 'before',
        title: 'Urgent: Membership Expires Tomorrow! ⚠️',
        message: '⚠️ Your gym membership expires tomorrow. Renew now to avoid workout interruption.',
        tone: 'urgent'
    },
    {
        daysOffset: 0, // Expiry day
        direction: 'before',
        title: 'Last Chance: Membership Expires Today! 🔴',
        message: 'Your membership expires today. Renew immediately to keep your access active!',
        tone: 'last_chance'
    },
    {
        daysOffset: 2, // 2 days AFTER expiry
        direction: 'after',
        title: 'Your Membership Has Expired 💔',
        message: 'Your gym membership expired 2 days ago. We have a special rejoin offer for you, renew today!',
        tone: 'winback'
    },
    {
        daysOffset: 4, // 4 days AFTER expiry
        direction: 'after',
        title: 'We Miss You! 💪 Special Rejoin Offer',
        message: 'It\'s been 4 days since your membership expired. Come back and continue your fitness goals!',
        tone: 'final'
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
                if (isFCMAvailable() && member.fcmTokens && member.fcmTokens.length > 0) {
                    const tokens = member.fcmTokens.map(t => t.token || t);
                    for (const token of tokens) {
                        await sendPushNotification(token, reminder.title, reminder.message, {
                            type: 'renewal_reminder',
                            tone: reminder.tone,
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
    // Run renewal reminders 3 times daily: 9:00 AM, 1:00 PM, and 7:00 PM (IST)
    cron.schedule('0 9,13,19 * * *', async () => {
        try {
            await runRenewalReminders();
        } catch (err) {
            console.error('[CRON] Renewal reminder cron failed:', err.message);
        }
    }, {
        timezone: 'Asia/Kolkata'
    });

    // Run expired membership updater daily at 12:01 AM (IST)
    cron.schedule('1 0 * * *', async () => {
        try {
            await updateExpiredMemberships();
        } catch (err) {
            console.error('[CRON] Expired membership cron failed:', err.message);
        }
    }, {
        timezone: 'Asia/Kolkata'
    });

    console.log('[CRON] Renewal reminder jobs scheduled (9:00 AM IST daily)');
    console.log('[CRON] Expired membership updater scheduled (12:01 AM IST daily)');
};

module.exports = { startRenewalCronJobs, runRenewalReminders, updateExpiredMemberships };
