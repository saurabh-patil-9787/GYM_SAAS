const DailyMission = require('../models/DailyMission');
const xpEngineService = require('./xpEngineService');
const moment = require('moment-timezone');

/**
 * Gets or creates today's daily mission for a member
 */
const getTodayMission = async (memberId, gymId) => {
    // We use IST for date string to be consistent with cron jobs
    const todayStr = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');

    let mission = await DailyMission.findOne({ member: memberId, date: todayStr });
    
    if (!mission) {
        // Generate standard daily tasks (can be randomized or based on level later)
        mission = await DailyMission.create({
            member: memberId,
            gym: gymId,
            date: todayStr,
            tasks: [
                { type: 'workout', isCompleted: false },
                { type: 'water', isCompleted: false },
                { type: 'stretch', isCompleted: false }
            ],
            rewardXP: 50
        });
    }

    return mission;
};

/**
 * Checks off a task if it exists in today's mission
 */
const completeTask = async (memberId, gymId, taskType) => {
    const todayStr = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
    const mission = await DailyMission.findOne({ member: memberId, date: todayStr });
    
    if (!mission) return false;

    let updated = false;
    for (let task of mission.tasks) {
        if (task.type === taskType && !task.isCompleted) {
            task.isCompleted = true;
            updated = true;
        }
    }

    if (updated) {
        await mission.save();
    }
    
    return updated;
};

/**
 * Claims the reward if all tasks are completed
 */
const claimReward = async (memberId, gymId) => {
    const todayStr = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
    const mission = await DailyMission.findOne({ member: memberId, date: todayStr });
    
    if (!mission) return { success: false, message: 'No mission found for today' };
    if (mission.isRewardClaimed) return { success: false, message: 'Reward already claimed' };

    const allCompleted = mission.tasks.every(t => t.isCompleted);
    if (!allCompleted) {
        return { success: false, message: 'Not all tasks are completed' };
    }

    // Award XP
    const result = await xpEngineService.awardXP(memberId, gymId, 'daily_mission_complete', 'Completed Daily Missions');
    
    if (result.success && result.awarded) {
        mission.isRewardClaimed = true;
        await mission.save();
        return { success: true, points: result.points, message: 'Reward claimed successfully' };
    }
    
    return { success: false, message: 'Failed to award XP' };
};

module.exports = {
    getTodayMission,
    completeTask,
    claimReward
};
