const Member = require('../models/Member');
const XPRule = require('../models/XPRule');
const XPHistory = require('../models/XPHistory');
const LevelProgression = require('../models/LevelProgression');
const fcmService = require('./fcmService');

/**
 * Gamification XP Engine Service
 */

/**
 * Internal method to check and handle Level Ups
 */
const checkLevelUp = async (member, oldLevel) => {
    // Find the highest level where xpThreshold <= member.totalXP
    const nextLevelDoc = await LevelProgression.findOne({ xpThreshold: { $lte: member.totalXP } })
        .sort({ level: -1 });

    if (nextLevelDoc && nextLevelDoc.level > oldLevel) {
        member.currentLevel = nextLevelDoc.level;
        
        // Trigger Push Notification
        const tokens = member.fcmTokens?.map(t => t.token) || [];
        if (tokens.length > 0) {
            fcmService.sendPushToMultiple(
                tokens,
                "🎉 Level Up!",
                `Congratulations! You are now Level ${member.currentLevel} - ${nextLevelDoc.title || 'Gym Rat'}!`,
                { type: 'gamification_level_up', link: '/member/gamification' }
            );
        }
    }
    return member;
};

/**
 * Awards XP for an action if allowed by idempotency rules.
 * @param {string} memberId - Member Object ID
 * @param {string} gymId - Gym Object ID
 * @param {string} actionType - 'workout', 'water', 'login', 'attendance'
 * @param {string} reason - Optional context (e.g. "Completed Daily Mission")
 */
const awardXP = async (memberId, gymId, actionType, reason = '') => {
    try {
        const member = await Member.findById(memberId);
        if (!member) return { success: false, message: 'Member not found' };

        // 1. Get the XP Rule (try Gym specific, fallback to Global)
        let rule = await XPRule.findOne({ gym: gymId, actionType, isActive: true });
        if (!rule) {
            rule = await XPRule.findOne({ gym: null, actionType, isActive: true });
        }
        
        if (!rule) return { success: false, message: 'No active XP rule found for this action' };

        // 2. Check Idempotency (How many times today?)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const historyCount = await XPHistory.countDocuments({
            member: memberId,
            activityType: actionType,
            createdAt: { $gte: startOfDay }
        });

        if (historyCount >= rule.limitPerDay) {
            // Already hit the limit, don't award XP but return success true for idempotency
            return { success: true, awarded: false, message: 'Daily limit reached for this action' };
        }

        const pointsToAward = rule.points;

        // 3. Save History
        await XPHistory.create({
            gym: gymId,
            member: memberId,
            activityType: actionType,
            points: pointsToAward,
            reason: reason || `Action: ${actionType}`
        });

        // 4. Update Member Stats
        const oldLevel = member.currentLevel;
        member.totalXP += pointsToAward;
        member.weeklyXP += pointsToAward;
        member.monthlyXP += pointsToAward;
        
        // 5. Update specific trackers
        const now = new Date();
        if (actionType === 'workout') {
            member.lastWorkoutDate = now;
            member.attendanceCount += 1;
        } else if (actionType === 'water') {
            member.lastWaterLogDate = now;
        } else if (actionType === 'login') {
            member.lastLoginDate = now;
        }

        // 6. Check for level up
        await checkLevelUp(member, oldLevel);
        
        // Recalculate consistency score (simplified logic)
        // E.g., cap at 100
        let newScore = member.consistencyScore + (pointsToAward * 0.1);
        member.consistencyScore = Math.min(Math.round(newScore), 100);

        await member.save();

        return { 
            success: true, 
            awarded: true, 
            points: pointsToAward, 
            newTotal: member.totalXP,
            levelUp: member.currentLevel > oldLevel
        };

    } catch (error) {
        console.error('[XP Engine] Error:', error);
        return { success: false, message: 'Internal server error' };
    }
};

module.exports = {
    awardXP
};
