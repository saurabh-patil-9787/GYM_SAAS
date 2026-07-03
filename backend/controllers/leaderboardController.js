const Member = require('../models/Member');
const DailyMission = require('../models/DailyMission');
const dailyMissionService = require('../services/dailyMissionService');
const xpEngineService = require('../services/xpEngineService');
const mongoose = require('mongoose');

// Helper to get surrounding ranks
const getSurroundingRanks = async (gymId, sortBy, memberTotal, limit = 1) => {
    // limit = 1 means 1 above and 1 below (total 3 including member)
    const above = await Member.find({ gym: gymId, [sortBy]: { $gt: memberTotal } })
        .sort({ [sortBy]: 1 })
        .limit(limit)
        .select('name photoUrl currentLevel totalXP weeklyXP monthlyXP streak');
        
    const below = await Member.find({ gym: gymId, [sortBy]: { $lt: memberTotal } })
        .sort({ [sortBy]: -1 })
        .limit(limit)
        .select('name photoUrl currentLevel totalXP weeklyXP monthlyXP streak');
        
    // above comes out ascending, we want descending order for leaderboard UI
    return { above: above.reverse(), below };
};

exports.getLeaderboard = async (req, res) => {
    try {
        const gymId = req.user.gym;
        const { type = 'overall', limit = 50 } = req.query;

        let sortBy = 'totalXP';
        if (type === 'weekly') sortBy = 'weeklyXP';
        if (type === 'monthly') sortBy = 'monthlyXP';
        if (type === 'streak') sortBy = 'streak';
        if (type === 'consistency') sortBy = 'consistencyScore';

        const topMembers = await Member.find({ gym: gymId })
            .sort({ [sortBy]: -1, createdAt: 1 })
            .limit(parseInt(limit))
            .select(`name photoUrl currentLevel totalXP weeklyXP monthlyXP streak consistencyScore previousRankOverall previousRankWeekly previousRankMonthly`);

        res.json({ success: true, leaderboard: topMembers });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, message: 'Server error fetching leaderboard' });
    }
};

exports.getSurroundingLeaderboard = async (req, res) => {
    try {
        const gymId = req.user.gym;
        const memberId = req.user._id; // Use _id (ObjectId) — consistent with Mongoose
        const { type = 'overall' } = req.query;

        let sortBy = 'totalXP';
        if (type === 'weekly') sortBy = 'weeklyXP';
        if (type === 'monthly') sortBy = 'monthlyXP';
        if (type === 'streak') sortBy = 'streak';

        const member = await Member.findById(memberId);
        if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

        const memberScore = member[sortBy];

        // Find exactly rank # by counting people strictly greater
        const rankCount = await Member.countDocuments({ gym: gymId, [sortBy]: { $gt: memberScore } });
        const myRank = rankCount + 1;

        const { above, below } = await getSurroundingRanks(gymId, sortBy, memberScore, 1);

        res.json({ 
            success: true, 
            myRank,
            surrounding: {
                above,
                me: {
                    _id: member._id,
                    name: member.name,
                    photoUrl: member.photoUrl,
                    currentLevel: member.currentLevel,
                    [sortBy]: memberScore,
                    streak: member.streak
                },
                below
            }
        });
    } catch (error) {
        console.error('Error fetching surrounding ranks:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getGamificationProfile = async (req, res) => {
    try {
        const gymId = req.user.gym;
        const memberId = req.user._id; // Use _id (ObjectId)

        const member = await Member.findById(memberId)
            .select('name photoUrl currentLevel totalXP weeklyXP monthlyXP streak longestStreak consistencyScore');

        if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

        const rankCount = await Member.countDocuments({ gym: gymId, totalXP: { $gt: member.totalXP } });
        const overallRank = rankCount + 1;

        // Fetch current level threshold (for progress bar bottom bound)
        const LevelProgression = require('../models/LevelProgression');
        const currentLevelDoc = await LevelProgression.findOne({ level: member.currentLevel });
        const nextLevel = await LevelProgression.findOne({ level: member.currentLevel + 1 });

        // Fetch Daily Missions
        const todayMission = await dailyMissionService.getTodayMission(memberId, gymId);

        // Fetch Badges (from Achievement collection — populated from Badge model)
        const Achievement = require('../models/Achievement');
        const achievements = await Achievement.find({ member: memberId }).populate('badge').lean();

        res.json({
            success: true,
            profile: member,
            overallRank,
            currentLevelThreshold: currentLevelDoc ? currentLevelDoc.xpThreshold : 0,
            nextLevelThreshold: nextLevel ? nextLevel.xpThreshold : null,
            todayMission,
            achievements
        });

    } catch (error) {
        console.error('Error fetching gamification profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.claimDailyMissionReward = async (req, res) => {
    try {
        const gymId = req.user.gym;
        const memberId = req.user._id;

        const result = await dailyMissionService.claimReward(memberId, gymId);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error claiming mission reward:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/leaderboard/missions/complete-task
 * Body: { taskType: 'stretch' | 'workout' | 'water' }
 * Manually marks a daily mission task as complete.
 * 'stretch' also awards 10 XP via the XP engine.
 * 'workout' and 'water' are intended to auto-complete — calling this is a fallback.
 */
exports.completeTask = async (req, res) => {
    try {
        const { taskType } = req.body;
        const memberId = req.user._id;
        const gymId = req.user.gym;

        const validTypes = ['workout', 'water', 'stretch'];
        if (!taskType || !validTypes.includes(taskType)) {
            return res.status(400).json({ success: false, message: `taskType must be one of: ${validTypes.join(', ')}` });
        }

        // Complete the task in today's mission
        const updated = await dailyMissionService.completeTask(memberId, gymId, taskType);

        // Award XP only for stretch (workout/water have their own XP via check-in and water tracker)
        let xpAwarded = 0;
        if (updated && taskType === 'stretch') {
            const xpResult = await xpEngineService.awardXP(memberId, gymId, 'stretch', 'Daily Stretch Completed');
            if (xpResult.awarded) xpAwarded = xpResult.points;
        }

        // Return refreshed mission
        const todayMission = await dailyMissionService.getTodayMission(memberId, gymId);

        res.json({ 
            success: true, 
            mission: todayMission,
            xpAwarded,
            message: updated 
                ? `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} task completed!${xpAwarded ? ` +${xpAwarded} XP` : ''}`
                : 'Task already completed'
        });
    } catch (error) {
        console.error('Error completing task:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/leaderboard/pr
 * Top members by their personal best 1RM across all exercises.
 */
exports.getPRLeaderboard = async (req, res) => {
    try {
        const gymId = req.user.gym;

        const results = await Member.aggregate([
            { $match: { gym: new mongoose.Types.ObjectId(gymId.toString()), 'personalRecords.0': { $exists: true } } },
            { $unwind: '$personalRecords' },
            { $sort: { 'personalRecords.oneRM': -1 } },
            { $group: {
                _id: '$_id',
                name:           { $first: '$name' },
                photoUrl:       { $first: '$photoUrl' },
                currentLevel:   { $first: '$currentLevel' },
                bestPR:         { $max: '$personalRecords.oneRM' },
                bestExercise:   { $first: '$personalRecords.exercise' }
            }},
            { $sort: { bestPR: -1 } },
            { $limit: 10 }
        ]);

        res.json({ success: true, leaderboard: results });
    } catch (error) {
        console.error('Error fetching PR leaderboard:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/leaderboard/pr/me
 * Current member's PR rank within their gym.
 */
exports.getMyPRRank = async (req, res) => {
    try {
        const gymId = req.user.gym;
        const memberId = req.user._id;

        const member = await Member.findById(memberId);
        if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

        const myBestPR = member.personalRecords?.length > 0
            ? Math.max(...member.personalRecords.map(p => p.oneRM))
            : 0;
        const bestRecord = member.personalRecords?.find(p => p.oneRM === myBestPR) || null;

        // Count how many gym members have a strictly higher best PR
        const higherCount = await Member.aggregate([
            { $match: { gym: new mongoose.Types.ObjectId(gymId.toString()), 'personalRecords.0': { $exists: true } } },
            { $unwind: '$personalRecords' },
            { $group: { _id: '$_id', bestPR: { $max: '$personalRecords.oneRM' } } },
            { $match: { bestPR: { $gt: myBestPR } } },
            { $count: 'count' }
        ]);

        const myRank = (higherCount[0]?.count || 0) + 1;

        res.json({
            success: true,
            myRank,
            surrounding: {
                above: [],
                me: {
                    _id: member._id,
                    name: member.name,
                    photoUrl: member.photoUrl,
                    currentLevel: member.currentLevel,
                    bestPR: myBestPR,
                    bestExercise: bestRecord?.exercise || ''
                },
                below: []
            }
        });
    } catch (error) {
        console.error('Error fetching PR rank:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

