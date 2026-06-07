const SystemSettings = require('../models/SystemSettings');

/**
 * In-memory settings cache with 30-second TTL.
 * 
 * M4 NOTE (Scalability): This in-memory cache works correctly on a SINGLE server instance.
 * If you scale to multiple instances (horizontal scaling / PM2 cluster mode), each
 * instance has its own separate cache, which can cause inconsistency:
 * - Instance A might have "payments enabled" cached
 * - Instance B might have "payments disabled" after an admin change
 * 
 * Fix for multi-instance scaling: Replace with Redis-based cache (ioredis/upstash).
 * Until then, the 30-second TTL limits the window of inconsistency.
 */
let cachedSettings = null;
let cachedSettingsTimestamp = null;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds — reduced from 60s for faster propagation

const getSettingsCached = async () => {
    try {
        // Cache invalidation: clear if TTL has elapsed
        if (cachedSettings && cachedSettingsTimestamp) {
            if (Date.now() - cachedSettingsTimestamp > CACHE_TTL_MS) {
                cachedSettings = null;
                cachedSettingsTimestamp = null;
            }
        }

        if (!cachedSettings) {
            cachedSettings = await SystemSettings.findOne({ configKey: 'GLOBAL' });
            if (!cachedSettings) {
                try {
                    // Auto create the singleton if it doesn't exist
                    cachedSettings = await SystemSettings.create({
                        configKey: 'GLOBAL',
                        isOnlinePaymentEnabled: true,
                        subscriptionMessage: "Online payment is currently stopped. Please connect with admin for plan renewal."
                    });
                } catch (dupError) {
                    if (dupError.code === 11000) {
                        // In case of race condition, the unique index rejected the second insert. Fetch it instead.
                        cachedSettings = await SystemSettings.findOne({ configKey: 'GLOBAL' });
                    } else {
                        throw dupError;
                    }
                }
            }
            cachedSettingsTimestamp = Date.now();
        }
        return cachedSettings;
    } catch (error) {
        console.error("Error fetching SystemSettings:", error);
        // Fallback to avoid breaking the system completely in case of DB read error
        return { isOnlinePaymentEnabled: true, subscriptionMessage: "Payment processing error. Please try again." };
    }
};

const clearSettingsCache = () => {
    cachedSettings = null;
    cachedSettingsTimestamp = null;
};

module.exports = { getSettingsCached, clearSettingsCache };
