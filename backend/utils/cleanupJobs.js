const cron = require('node-cron');

// AUDIT FIX 10: Daily cron to remove expired refresh tokens and prevent unbounded collection growth
const startCleanupJobs = (RefreshToken) => {
    // Run every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        try {
            // NOTE: RefreshToken schema uses 'expires' (not 'expiresAt') — confirmed from models/RefreshToken.js
            const result = await RefreshToken.deleteMany({
                expires: { $lt: new Date() }
            });
            console.log('[CRON] Cleaned up', result.deletedCount, 'expired refresh tokens');
        } catch (err) {
            console.error('[CRON] Refresh token cleanup failed:', err.message);
        }
    });

    console.log('[CRON] Cleanup jobs scheduled');
};

module.exports = { startCleanupJobs };
