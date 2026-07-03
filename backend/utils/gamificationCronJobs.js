const cron = require('node-cron');
const moment = require('moment-timezone');
const Member = require('../models/Member');
const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const DailyMission = require('../models/DailyMission');

/**
 * Initializes all Gamification Cron Jobs
 * Timezone: Asia/Kolkata (IST)
 */
const initGamificationCronJobs = () => {

    // 1. Midnight Daily (IST)
    // Run every day at 00:05 IST to process streaks and missions
    cron.schedule('5 0 * * *', async () => {
        try {
            console.log(`[Gamification Cron] Running daily midnight job (IST: ${moment().tz('Asia/Kolkata').format()})`);
            
            const todayStr = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
            const yesterdayDate = moment().tz('Asia/Kolkata').subtract(1, 'days');
            const yesterdayDayOfWeek = yesterdayDate.day(); // 0 is Sunday, 6 is Saturday
            const twoDaysAgoDate = moment().tz('Asia/Kolkata').subtract(2, 'days');

            // Streak Logic: If yesterday was Sunday, we don't penalize. 
            // Also, there is a 1-day grace period.
            // If they missed both yesterday AND day before yesterday (and neither was Sunday), reset streak.
            
            const activeMembers = await Member.find({ status: 'Active' });
            
            for (const member of activeMembers) {
                let resetStreak = false;
                
                if (member.streak > 0) {
                    const lastWorkout = member.lastWorkoutDate ? moment(member.lastWorkoutDate).tz('Asia/Kolkata') : null;
                    
                    if (!lastWorkout) {
                        resetStreak = true;
                    } else {
                        // Days since last workout
                        const daysDiff = moment().tz('Asia/Kolkata').startOf('day').diff(lastWorkout.startOf('day'), 'days');
                        
                        // Ignore Sundays
                        if (yesterdayDayOfWeek === 0) {
                            // Yesterday was Sunday. We give them a free pass.
                            // If they also missed Saturday and Friday, that's 2 consecutive missed days (excluding Sunday).
                            if (daysDiff > 3) resetStreak = true; 
                        } else {
                            // Not Sunday. 1 day grace means daysDiff > 2 is a break.
                            if (daysDiff > 2) resetStreak = true;
                        }
                    }
                }

                if (resetStreak) {
                    member.streak = 0;
                    await member.save();
                }

                // Generate new daily mission if not exists
                const existingMission = await DailyMission.findOne({ member: member._id, date: todayStr });
                if (!existingMission) {
                    await DailyMission.create({
                        member: member._id,
                        gym: member.gym,
                        date: todayStr,
                        tasks: [
                            { type: 'workout', isCompleted: false },
                            { type: 'water', isCompleted: false },
                            { type: 'stretch', isCompleted: false }
                        ],
                        rewardXP: 50
                    });
                }
            }
        } catch (error) {
            console.error('[Gamification Cron] Daily Job Error:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    // 2. Weekly Reset (Monday 00:00 IST)
    cron.schedule('0 0 * * 1', async () => {
        try {
            console.log('[Gamification Cron] Running Weekly Reset');
            
            // For every gym, get top 3 by weeklyXP and take snapshot
            const gyms = await Member.distinct('gym');
            
            for (const gymId of gyms) {
                const top3 = await Member.find({ gym: gymId, weeklyXP: { $gt: 0 } })
                    .sort({ weeklyXP: -1 })
                    .limit(3)
                    .select('name photoUrl weeklyXP');
                
                const top3Formatted = top3.map((m, index) => ({
                    member: m._id,
                    name: m.name,
                    photoUrl: m.photoUrl,
                    xp: m.weeklyXP,
                    rank: index + 1
                }));

                if (top3Formatted.length > 0) {
                    await LeaderboardSnapshot.create({
                        gym: gymId,
                        type: 'weekly',
                        periodString: `Week ${moment().tz('Asia/Kolkata').isoWeek()} ${moment().tz('Asia/Kolkata').year()}`,
                        top3: top3Formatted
                    });
                }
                
                // Update previous ranks and reset weeklyXP
                const allMembers = await Member.find({ gym: gymId }).sort({ weeklyXP: -1 });
                const bulkOps = allMembers.map((m, index) => ({
                    updateOne: {
                        filter: { _id: m._id },
                        update: { 
                            $set: { 
                                previousRankWeekly: index + 1,
                                weeklyXP: 0 
                            } 
                        }
                    }
                }));
                if(bulkOps.length > 0){
                    await Member.bulkWrite(bulkOps);
                }
            }
        } catch (error) {
            console.error('[Gamification Cron] Weekly Reset Error:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    // 3. Monthly Reset (1st of the Month 00:00 IST)
    cron.schedule('0 0 1 * *', async () => {
        try {
            console.log('[Gamification Cron] Running Monthly Reset');
            
            const gyms = await Member.distinct('gym');
            
            for (const gymId of gyms) {
                const top3 = await Member.find({ gym: gymId, monthlyXP: { $gt: 0 } })
                    .sort({ monthlyXP: -1 })
                    .limit(3)
                    .select('name photoUrl monthlyXP');
                
                const top3Formatted = top3.map((m, index) => ({
                    member: m._id,
                    name: m.name,
                    photoUrl: m.photoUrl,
                    xp: m.monthlyXP,
                    rank: index + 1
                }));

                if (top3Formatted.length > 0) {
                    await LeaderboardSnapshot.create({
                        gym: gymId,
                        type: 'monthly',
                        periodString: moment().tz('Asia/Kolkata').subtract(1, 'days').format('MMMM YYYY'),
                        top3: top3Formatted
                    });
                    
                    // Award Champion Badge to #1
                    const Achievement = require('../models/Achievement');
                    const Badge = require('../models/Badge');
                    
                    const championBadge = await Badge.findOne({ name: "Monthly Champion", tier: "champion" });
                    if (championBadge) {
                        await Achievement.create({
                            member: top3Formatted[0].member,
                            badge: championBadge._id,
                            gym: gymId
                        });
                    }
                }
                
                // Update previous ranks and reset monthlyXP
                const allMembers = await Member.find({ gym: gymId }).sort({ monthlyXP: -1 });
                const bulkOps = allMembers.map((m, index) => ({
                    updateOne: {
                        filter: { _id: m._id },
                        update: { 
                            $set: { 
                                previousRankMonthly: index + 1,
                                monthlyXP: 0 
                            } 
                        }
                    }
                }));
                if(bulkOps.length > 0){
                    await Member.bulkWrite(bulkOps);
                }
            }
        } catch (error) {
            console.error('[Gamification Cron] Monthly Reset Error:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

};

module.exports = initGamificationCronJobs;
