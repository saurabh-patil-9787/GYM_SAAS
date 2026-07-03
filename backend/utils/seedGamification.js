const XPRule = require('../models/XPRule');
const LevelProgression = require('../models/LevelProgression');
const Member = require('../models/Member');
const moment = require('moment-timezone');

const calculateStreak = (checkIns) => {
    if (!checkIns || checkIns.length === 0) return 0;
    const dateSet = new Set(checkIns.map(c => c.date));
    const tz = 'Asia/Kolkata';
    const today = moment().tz(tz);
    const todayStr = today.format('YYYY-MM-DD');
    const yesterday = moment().tz(tz).subtract(1, 'days');
    const yesterdayStr = yesterday.format('YYYY-MM-DD');
    const dayBeforeYesterday = moment().tz(tz).subtract(2, 'days');
    const dayBeforeYesterdayStr = dayBeforeYesterday.format('YYYY-MM-DD');
    
    let startDate = null;
    if (dateSet.has(todayStr)) startDate = today.clone();
    else if (today.day() !== 0 && dateSet.has(yesterdayStr)) startDate = yesterday.clone();
    else if (today.day() === 0 && dateSet.has(yesterdayStr)) startDate = yesterday.clone();
    else if (yesterday.day() === 0 && dateSet.has(dayBeforeYesterdayStr)) startDate = dayBeforeYesterday.clone();
    else return 0;

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
            if (consecutiveMisses >= 2) break;
            cursor.subtract(1, 'days');
        }
    }
    return streak;
};

/**
 * Seeds default global XP Rules and Level Progression if they don't exist yet.
 * Safe to run on every server start — uses upsert so it never duplicates.
 */
const seedGamification = async () => {
    try {
        // ── XP Rules ─────────────────────────────────────────────
        const defaultRules = [
            { actionType: 'workout',                points: 30, limitPerDay: 1 },
            { actionType: 'water',                  points: 10, limitPerDay: 1 },
            { actionType: 'attendance',             points: 20, limitPerDay: 1 },
            { actionType: 'stretch',                points: 10, limitPerDay: 1 },
            { actionType: 'login',                  points:  5, limitPerDay: 1 },
            { actionType: 'daily_mission_complete', points: 50, limitPerDay: 1 },
        ];

        for (const rule of defaultRules) {
            await XPRule.findOneAndUpdate(
                { gym: null, actionType: rule.actionType },
                { ...rule, gym: null, isActive: true },
                { upsert: true, setDefaultsOnInsert: true }
            );
        }

        // ── Level Progression ─────────────────────────────────────
        const levels = [
            { level: 1,  xpThreshold: 0,     title: 'Rookie'    },
            { level: 2,  xpThreshold: 200,   title: 'Trainee'   },
            { level: 3,  xpThreshold: 500,   title: 'Regular'   },
            { level: 4,  xpThreshold: 1000,  title: 'Athlete'   },
            { level: 5,  xpThreshold: 2000,  title: 'Warrior'   },
            { level: 6,  xpThreshold: 3500,  title: 'Champion'  },
            { level: 7,  xpThreshold: 5500,  title: 'Legend'    },
            { level: 8,  xpThreshold: 8000,  title: 'Elite'     },
            { level: 9,  xpThreshold: 11000, title: 'Titan'     },
            { level: 10, xpThreshold: 15000, title: 'God Mode 🔥' },
        ];

        for (const lvl of levels) {
            await LevelProgression.findOneAndUpdate(
                { level: lvl.level },
                lvl,
                { upsert: true, setDefaultsOnInsert: true }
            );
        }

        console.log('[Gamification] ✅ XP Rules & Level Progression seeded successfully.');

        // ── Streak Sync (One-time routine) ─────────────────────────
        try {
            const members = await Member.find({});
            let streakUpdates = 0;
            for (const member of members) {
                const actualStreak = calculateStreak(member.checkIns);
                let needsSave = false;
                if (member.streak !== actualStreak) {
                    member.streak = actualStreak;
                    needsSave = true;
                }
                if (actualStreak > (member.longestStreak || 0)) {
                    member.longestStreak = actualStreak;
                    needsSave = true;
                }
                if (needsSave) {
                    await member.save();
                    streakUpdates++;
                }
            }
            if (streakUpdates > 0) {
                console.log(`[Gamification] 🔥 Synced true streaks for ${streakUpdates} members.`);
            }
        } catch (e) {
            console.error('[Gamification] Streak sync error:', e.message);
        }
    } catch (err) {
        console.error('[Gamification] Seed error:', err.message);
    }
};

module.exports = seedGamification;
