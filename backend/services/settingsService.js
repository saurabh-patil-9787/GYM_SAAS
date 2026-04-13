const SystemSettings = require('../models/SystemSettings');

let cachedSettings = null;
let cachedSettingsTimestamp = null;

const getSettingsCached = async () => {
    try {
        // Cache invalidation safety check - 60 seconds TTL
        if (cachedSettings && cachedSettingsTimestamp) {
            if (Date.now() - cachedSettingsTimestamp > 60000) {
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
