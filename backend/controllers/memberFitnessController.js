const Member = require('../models/Member');
const Gym = require('../models/Gym');
const xpEngineService = require('../services/xpEngineService');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const dailyMissionService = require('../services/dailyMissionService');

// Static catalog of 12 badges
const BADGE_CATALOG = [
    { id: 'first_step', name: 'First Step', description: 'Log your first daily check-in', icon: 'Flame', category: 'consistency' },
    { id: 'streak_7', name: '7-Day Streak', description: 'Maintain a 7-day gym check-in streak', icon: 'Zap', category: 'consistency' },
    { id: 'streak_30', name: '30-Day Warrior', description: 'Maintain a 30-day gym check-in streak', icon: 'Award', category: 'consistency' },
    { id: 'centurion', name: 'Centurion', description: 'Log 100 total daily check-ins', icon: 'Crown', category: 'consistency' },
    { id: 'club_3m', name: '3-Month Club', description: 'Be a active gym member for 3 months', icon: 'ShieldAlert', category: 'milestone' },
    { id: 'club_6m', name: '6-Month Club', description: 'Be an active gym member for 6 months', icon: 'ShieldCheck', category: 'milestone' },
    { id: 'annual_champion', name: 'Annual Champion', description: 'Be an active gym member for 1 year', icon: 'Trophy', category: 'milestone' },
    { id: 'pr_breaker', name: 'PR Breaker', description: 'Log your first Personal Record (1RM)', icon: 'Activity', category: 'fitness' },
    { id: 'target_reached', name: 'Target Reached', description: 'Reach your target fitness goal weight', icon: 'Target', category: 'fitness' },
    { id: 'data_nerd', name: 'Data Nerd', description: 'Log weight/measurements 10 times', icon: 'BarChart2', category: 'fitness' },
    { id: 'health_enthusiast', name: 'Health Enthusiast', description: 'Complete your fitness profile (gender, goal, height, weight)', icon: 'UserCheck', category: 'profile' },
    { id: 'water_warrior', name: 'Water Warrior', description: 'Hit your daily water target in water tracker', icon: 'Droplets', category: 'fitness' }
];

// Helper function to unlock a badge
const unlockBadgeHelper = async (member, badgeId) => {
    const alreadyUnlocked = member.unlockedBadges.some(b => b.badgeId === badgeId);
    if (!alreadyUnlocked) {
        member.unlockedBadges.push({ badgeId, unlockedAt: new Date() });
        return true;
    }
    return false;
};

// Helper function to calculate current streak
// Rules:
//   1. Sundays are always skipped — missing Sunday never counts as a miss.
//   2. Missing ONE non-Sunday day in a row is forgiven — streak continues.
//   3. Missing TWO or more consecutive non-Sunday days breaks the streak to 0.
const calculateStreak = (checkIns) => {
    if (!checkIns || checkIns.length === 0) return 0;

    const dateSet = new Set(checkIns.map(c => c.date));

    // Gamification uses Asia/Kolkata timezone
    const tz = 'Asia/Kolkata';
    const today = moment().tz(tz);
    const todayStr = today.format('YYYY-MM-DD');

    const yesterday = moment().tz(tz).subtract(1, 'days');
    const yesterdayStr = yesterday.format('YYYY-MM-DD');

    const dayBeforeYesterday = moment().tz(tz).subtract(2, 'days');
    const dayBeforeYesterdayStr = dayBeforeYesterday.format('YYYY-MM-DD');

    let startDate = null;

    if (dateSet.has(todayStr)) {
        startDate = today.clone();
    } else if (today.day() !== 0 && dateSet.has(yesterdayStr)) {
        startDate = yesterday.clone();
    } else if (today.day() === 0 && dateSet.has(yesterdayStr)) {
        startDate = yesterday.clone();
    } else if (yesterday.day() === 0 && dateSet.has(dayBeforeYesterdayStr)) {
        startDate = dayBeforeYesterday.clone();
    } else {
        return 0; // Streak broken
    }

    let streak = 0;
    let consecutiveMisses = 0;
    const cursor = startDate.clone();

    while (true) {
        const curStr = cursor.format('YYYY-MM-DD');

        if (cursor.day() === 0) {
            cursor.subtract(1, 'days');
            continue;
        }

        if (dateSet.has(curStr)) {
            streak++;
            consecutiveMisses = 0;
            cursor.subtract(1, 'days');
        } else {
            consecutiveMisses++;
            if (consecutiveMisses >= 2) {
                break;
            }
            cursor.subtract(1, 'days');
        }
    }

    return streak;
};

// Helper to check and unlock profile completion badge
const checkProfileCompleteness = async (member) => {
    if (member.gender && member.activityLevel && member.fitnessGoal && member.height && member.weight) {
        return await unlockBadgeHelper(member, 'health_enthusiast');
    }
    return false;
};

// @desc    Save Personal Record (1RM)
// @route   POST /api/member/prs
// @access  Private (Member)
const savePR = async (req, res, next) => {
    const { exercise, oneRM } = req.body;

    if (!exercise || !oneRM) {
        return res.status(400).json({ message: 'Exercise and oneRM weight are required' });
    }

    try {
        const member = await Member.findById(req.member._id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        member.personalRecords.push({
            exercise,
            oneRM: Number(oneRM),
            date: new Date()
        });

        // Unlock "PR Breaker" badge
        const badgeUnlocked = await unlockBadgeHelper(member, 'pr_breaker');

        await member.save();

        res.status(201).json({
            message: 'Personal record saved successfully!',
            personalRecords: member.personalRecords,
            newBadgeUnlocked: badgeUnlocked ? 'pr_breaker' : null
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Personal Records
// @route   GET /api/member/prs
// @access  Private (Member)
const getPRs = async (req, res, next) => {
    try {
        const member = await Member.findById(req.member._id).select('personalRecords');
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json(member.personalRecords);
    } catch (error) {
        next(error);
    }
};

// @desc    Log Weight & Measurements
// @route   POST /api/member/progress
// @access  Private (Member)
const logProgress = async (req, res, next) => {
    const { weight, waist, chest, hip, arms, thighs, notes } = req.body;

    if (!weight) {
        return res.status(400).json({ message: 'Weight is required' });
    }

    try {
        const member = await Member.findById(req.member._id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Add log
        member.progressLogs.push({
            date: new Date(),
            weight: Number(weight),
            waist: waist ? Number(waist) : null,
            chest: chest ? Number(chest) : null,
            hip: hip ? Number(hip) : null,
            arms: arms ? Number(arms) : null,
            thighs: thighs ? Number(thighs) : null,
            notes: notes || ''
        });

        // Sync weight back to core member profile
        member.weight = Number(weight);

        // Check for Data Nerd badge (10 logs)
        let unlockedBadgesList = [];
        if (member.progressLogs.length >= 10) {
            const dataNerdUnlocked = await unlockBadgeHelper(member, 'data_nerd');
            if (dataNerdUnlocked) unlockedBadgesList.push('data_nerd');
        }

        // Check for Target Reached badge
        if (member.goalWeight && member.fitnessGoal) {
            let reached = false;
            if (member.fitnessGoal === 'lose_weight' && Number(weight) <= member.goalWeight) {
                reached = true;
            } else if (member.fitnessGoal === 'gain_muscle' && Number(weight) >= member.goalWeight) {
                reached = true;
            } else if (member.fitnessGoal === 'maintain' && Math.abs(Number(weight) - member.goalWeight) <= 1) {
                reached = true;
            }

            if (reached) {
                const targetReached = await unlockBadgeHelper(member, 'target_reached');
                if (targetReached) unlockedBadgesList.push('target_reached');
            }
        }

        // Check for Health Enthusiast badge
        const enthusiastUnlocked = await checkProfileCompleteness(member);
        if (enthusiastUnlocked) unlockedBadgesList.push('health_enthusiast');

        await member.save();

        res.status(201).json({
            message: 'Progress logged successfully!',
            progressLogs: member.progressLogs,
            weight: member.weight,
            unlockedBadges: unlockedBadgesList
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Progress Logs
// @route   GET /api/member/progress
// @access  Private (Member)
const getProgressLogs = async (req, res, next) => {
    try {
        const member = await Member.findById(req.member._id).select('progressLogs goalWeight fitnessGoal targetDate height weight');
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json({
            progressLogs: member.progressLogs,
            goalWeight: member.goalWeight,
            fitnessGoal: member.fitnessGoal,
            targetDate: member.targetDate,
            height: member.height,
            weight: member.weight
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Daily Gym Check-in
// @route   POST /api/member/checkin
// @access  Private (Member)
const checkInToday = async (req, res, next) => {
    const { date } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    try {
        const member = await Member.findById(req.member._id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Check if already checked in today
        const alreadyCheckedIn = member.checkIns.some(c => c.date === dateStr);
        let currentStreak = calculateStreak(member.checkIns);

        if (alreadyCheckedIn) {
            return res.status(200).json({
                message: 'Already checked in today!',
                checkIns: member.checkIns,
                streak: currentStreak,
                newBadgeUnlocked: null
            });
        }

        // Push new check-in
        member.checkIns.push({ date: dateStr });
        
        // Recalculate streak after adding today's checkin
        currentStreak = calculateStreak(member.checkIns);

        // ── Sync gamification streak field (used by leaderboard) ──
        member.streak = currentStreak;
        if (currentStreak > (member.longestStreak || 0)) {
            member.longestStreak = currentStreak;
        }

        let unlockedBadgesList = [];

        // Check badges:
        // 1. First Step (1 check-in)
        if (member.checkIns.length >= 1) {
            const firstStepUnlocked = await unlockBadgeHelper(member, 'first_step');
            if (firstStepUnlocked) unlockedBadgesList.push('first_step');
        }

        // 2. 7-Day Streak
        if (currentStreak >= 7) {
            const streak7Unlocked = await unlockBadgeHelper(member, 'streak_7');
            if (streak7Unlocked) unlockedBadgesList.push('streak_7');
        }

        // 3. 30-Day Warrior
        if (currentStreak >= 30) {
            const streak30Unlocked = await unlockBadgeHelper(member, 'streak_30');
            if (streak30Unlocked) unlockedBadgesList.push('streak_30');
        }

        // 4. Centurion (100 total check-ins)
        if (member.checkIns.length >= 100) {
            const centurionUnlocked = await unlockBadgeHelper(member, 'centurion');
            if (centurionUnlocked) unlockedBadgesList.push('centurion');
        }

        await member.save();

        // ── Award XP for check-in (workout action) ──────────────────
        // Also auto-completes the daily mission 'workout' task
        try {
            await xpEngineService.awardXP(member._id, member.gym, 'workout', 'Daily Gym Check-in');
            await dailyMissionService.completeTask(member._id, member.gym, 'workout');
        } catch (xpErr) {
            console.error('[CheckIn] XP/Mission update failed (non-critical):', xpErr.message);
        }

        res.status(200).json({
            message: 'Check-in registered successfully! Keep it up! 🔥',
            checkIns: member.checkIns,
            streak: currentStreak,
            unlockedBadges: unlockedBadgesList
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Check-ins and Streaks
// @route   GET /api/member/checkins
// @access  Private (Member)
const getCheckIns = async (req, res, next) => {
    try {
        const member = await Member.findById(req.member._id).select('checkIns');
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        const streak = calculateStreak(member.checkIns);
        res.json({
            checkIns: member.checkIns,
            streak
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Badge Wall with locked/unlocked details
// @route   GET /api/member/badges
// @access  Private (Member)
const getBadges = async (req, res, next) => {
    try {
        const member = await Member.findById(req.member._id).select('unlockedBadges checkIns progressLogs paymentHistory joiningDate gender activityLevel fitnessGoal height weight');
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // We can run active checks for milestone/time-based badges on demand to unlock them!
        let newlyUnlocked = [];

        // Check membership duration in months
        const joinDate = new Date(member.joiningDate || member.createdAt);
        const now = new Date();
        const diffMonths = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());

        if (diffMonths >= 3) {
            const club3Unlocked = await unlockBadgeHelper(member, 'club_3m');
            if (club3Unlocked) newlyUnlocked.push('club_3m');
        }
        if (diffMonths >= 6) {
            const club6Unlocked = await unlockBadgeHelper(member, 'club_6m');
            if (club6Unlocked) newlyUnlocked.push('club_6m');
        }
        if (diffMonths >= 12) {
            const annualUnlocked = await unlockBadgeHelper(member, 'annual_champion');
            if (annualUnlocked) newlyUnlocked.push('annual_champion');
        }

        // Check Health Enthusiast status
        const enthusiastUnlocked = await checkProfileCompleteness(member);
        if (enthusiastUnlocked) newlyUnlocked.push('health_enthusiast');

        if (newlyUnlocked.length > 0) {
            await member.save();
        }

        // Merge catalog with member's unlocked badges status
        const badgesResponse = BADGE_CATALOG.map(badge => {
            const unlockInfo = member.unlockedBadges.find(ub => ub.badgeId === badge.id);
            return {
                ...badge,
                unlocked: !!unlockInfo,
                unlockedAt: unlockInfo ? unlockInfo.unlockedAt : null
            };
        });

        // Compute Health Score
        // 1. BMI status (25 pts if calculated, let's say profile has height & weight)
        let bmiScore = (member.height && member.weight) ? 25 : 0;
        // 2. Consistency: check-ins in the last 30 days. Let's say if checked in >= 12 times in last 30 days -> 25 pts, else proportional
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const last30CheckIns = member.checkIns.filter(c => new Date(c.date) >= thirtyDaysAgo).length;
        const consistencyScore = Math.min(25, Math.round((last30CheckIns / 12) * 25));

        // 3. Goal setting & progress logs: has goal weight and logged weight at least twice -> 25 pts
        let goalScore = 0;
        if (member.goalWeight && member.fitnessGoal) {
            goalScore += 10;
            if (member.progressLogs.length >= 2) {
                goalScore += 15;
            } else if (member.progressLogs.length === 1) {
                goalScore += 5;
            }
        }

        // 4. Profile completeness (gender, activity level, dob, city, etc.) -> 25 pts
        let completenessScore = 0;
        if (member.gender) completenessScore += 5;
        if (member.activityLevel) completenessScore += 5;
        if (member.dob) completenessScore += 5;
        if (member.city) completenessScore += 5;
        if (member.preferredWorkoutTime) completenessScore += 5;

        const healthScore = bmiScore + consistencyScore + goalScore + completenessScore;

        res.json({
            badges: badgesResponse,
            healthScore: Math.min(100, healthScore),
            consistencyCount: member.checkIns.length,
            daysJoined: Math.max(1, Math.round((now - joinDate) / (1000 * 60 * 60 * 24)))
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Unlock Water Warrior Badge (triggered from frontend upon daily target completion)
// @route   POST /api/member/badges/water-warrior
// @access  Private (Member)
const unlockWaterWarrior = async (req, res, next) => {
    try {
        const member = await Member.findById(req.member._id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const unlocked = await unlockBadgeHelper(member, 'water_warrior');
        if (unlocked) {
            await member.save();
        }

        // ── Award XP for hitting water goal + auto-complete daily mission water task ──
        try {
            await xpEngineService.awardXP(member._id, member.gym, 'water', 'Hit Daily Water Goal');
            await dailyMissionService.completeTask(member._id, member.gym, 'water');
        } catch (xpErr) {
            console.error('[WaterWarrior] XP/Mission update failed (non-critical):', xpErr.message);
        }

        res.json({
            message: unlocked ? 'Water Warrior badge unlocked! 💧' : 'Already unlocked!',
            unlocked
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update Fitness Goals
// @route   PUT /api/member/fitness-goals
// @access  Private (Member)
const updateFitnessGoals = async (req, res, next) => {
    const { fitnessGoal, goalWeight, targetDate, activityLevel, preferredWorkoutTime } = req.body;

    try {
        const member = await Member.findById(req.member._id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        if (fitnessGoal) member.fitnessGoal = fitnessGoal;
        if (goalWeight !== undefined) member.goalWeight = goalWeight ? Number(goalWeight) : null;
        if (targetDate) member.targetDate = new Date(targetDate);
        if (activityLevel) member.activityLevel = activityLevel;
        if (preferredWorkoutTime) member.preferredWorkoutTime = preferredWorkoutTime;

        // Check Health Enthusiast status
        const enthusiastUnlocked = await checkProfileCompleteness(member);

        await member.save();

        res.json({
            message: 'Fitness goals updated successfully!',
            member: {
                fitnessGoal: member.fitnessGoal,
                goalWeight: member.goalWeight,
                targetDate: member.targetDate,
                activityLevel: member.activityLevel,
                preferredWorkoutTime: member.preferredWorkoutTime
            },
            newBadgeUnlocked: enthusiastUnlocked ? 'health_enthusiast' : null
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    savePR,
    getPRs,
    logProgress,
    getProgressLogs,
    checkInToday,
    getCheckIns,
    getBadges,
    unlockWaterWarrior,
    updateFitnessGoals
};
