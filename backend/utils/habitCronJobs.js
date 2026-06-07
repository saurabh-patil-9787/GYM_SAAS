const cron = require('node-cron');
const Member = require('../models/Member');
const { sendPushToMultiple, isFCMAvailable } = require('../services/fcmService');

/**
 * Helper to fetch all Active members who have a specific notification preference enabled
 * and possess at least one FCM token.
 */
const getMembersForPreference = async (preferenceKey) => {
    try {
        const query = {
            status: 'Active',
            [`notificationPreferences.${preferenceKey}`]: true,
            'fcmTokens.0': { $exists: true }
        };
        // Fetch only necessary fields
        return await Member.find(query).select('_id fcmTokens');
    } catch (error) {
        console.error(`[CRON] Error fetching members for ${preferenceKey}:`, error);
        return [];
    }
};

/**
 * Helper to extract all valid FCM tokens from a list of members
 */
const extractTokens = (members) => {
    let tokens = [];
    members.forEach(member => {
        if (member.fcmTokens && member.fcmTokens.length > 0) {
            tokens.push(...member.fcmTokens.map(t => t.token));
        }
    });
    return tokens;
};

/**
 * Initialize all Habit / Health Reminder Cron Jobs
 */
const initHabitCronJobs = () => {
    console.log('[CRON] Initializing Habit & Health Reminders...');

    // ─────────────────────────────────────────────────────────────
    // 1. Water Reminders (10:00 AM, 2:00 PM, 7:00 PM)
    // ─────────────────────────────────────────────────────────────
    const waterSchedule = ['0 10 * * *', '0 14 * * *', '0 19 * * *'];
    waterSchedule.forEach(time => {
        cron.schedule(time, async () => {
            if (!isFCMAvailable()) return;
            console.log('[CRON] Running Water Reminder Job...');
            
            const members = await getMembersForPreference('waterReminder');
            const tokens = extractTokens(members);
            
            if (tokens.length > 0) {
                await sendPushToMultiple(
                    tokens,
                    '💧 Stay Hydrated',
                    'Have you drank your water today? Keep up the good work!',
                    { type: 'water_reminder' }
                );
            }
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Gym Day Reminders (7:00 AM, 5:30 PM)
    // ─────────────────────────────────────────────────────────────
    const gymSchedule = ['0 7 * * *', '30 17 * * *'];
    gymSchedule.forEach(time => {
        cron.schedule(time, async () => {
            if (!isFCMAvailable()) return;
            console.log('[CRON] Running Gym Day Reminder Job...');
            
            const members = await getMembersForPreference('gymDayReminder');
            const tokens = extractTokens(members);
            
            if (tokens.length > 0) {
                await sendPushToMultiple(
                    tokens,
                    '💪 Time to Crush It!',
                    'Don\'t forget your workout today. Let\'s get those gains!',
                    { type: 'gymDayReminder' }
                );
            }
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Body Measurements (Saturday 8:00 AM & 8:00 PM)
    // ─────────────────────────────────────────────────────────────
    const measurementSchedule = ['0 8 * * 6', '0 20 * * 6'];
    measurementSchedule.forEach(time => {
        cron.schedule(time, async () => {
            if (!isFCMAvailable()) return;
            console.log('[CRON] Running Body Measurements Reminder Job...');
            
            const members = await getMembersForPreference('measurementReminder');
            const tokens = extractTokens(members);
            
            if (tokens.length > 0) {
                await sendPushToMultiple(
                    tokens,
                    '📏 Weekly Check-in',
                    'Time to log your body measurements for this week!',
                    { type: 'measurementReminder' }
                );
            }
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Weekly Goal Check-in (Saturday 8:00 AM & 8:00 PM)
    // ─────────────────────────────────────────────────────────────
    const goalSchedule = ['0 8 * * 6', '0 20 * * 6'];
    goalSchedule.forEach(time => {
        cron.schedule(time, async () => {
            if (!isFCMAvailable()) return;
            console.log('[CRON] Running Weekly Goal Check-in Job...');
            
            const members = await getMembersForPreference('weeklyGoalCheckin');
            const tokens = extractTokens(members);
            
            if (tokens.length > 0) {
                await sendPushToMultiple(
                    tokens,
                    '🎯 Weekly Goals Review',
                    'Review your fitness progress for the week and set new targets.',
                    { type: 'weeklyGoalCheckin' }
                );
            }
        });
    });
};

module.exports = initHabitCronJobs;
