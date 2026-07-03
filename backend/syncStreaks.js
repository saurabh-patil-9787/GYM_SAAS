require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Member = require('./models/Member');

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

const syncAllStreaks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('DB Connected. Starting streak sync...');

        const members = await Member.find({});
        let updatedCount = 0;

        for (const member of members) {
            const currentStreak = calculateStreak(member.checkIns);
            let updated = false;

            if (member.streak !== currentStreak) {
                member.streak = currentStreak;
                updated = true;
            }

            if (currentStreak > (member.longestStreak || 0)) {
                member.longestStreak = currentStreak;
                updated = true;
            }

            if (updated) {
                await member.save();
                updatedCount++;
                console.log(`Updated member ${member.name} - Streak: ${currentStreak}`);
            }
        }

        console.log(`Sync complete! Updated ${updatedCount} members.`);
        process.exit(0);
    } catch (err) {
        console.error('Error syncing streaks:', err);
        process.exit(1);
    }
};

syncAllStreaks();
