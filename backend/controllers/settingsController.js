const { getSettingsCached, clearSettingsCache } = require('../services/settingsService');
const SystemSettings = require('../models/SystemSettings');
const AdminLog = require('../models/AdminLog');

// @desc    Get global Settings
// @route   GET /api/settings
// @access  Public / Protected (can be accessed securely via context API)
const getSettings = async (req, res) => {
    try {
        const settings = await getSettingsCached();
        res.status(200).json({ success: true, settings });
    } catch (error) {
        console.error("Error in getSettings controller", error);
        res.status(500).json({ success: false, message: "Failed to fetch settings" });
    }
};

// @desc    Update global online subscription stat
// @route   PUT /api/settings/subscription
// @access  Admin Only
const updateSubscriptionStatus = async (req, res) => {
    try {
        const { isOnlinePaymentEnabled, subscriptionMessage } = req.body;

        // Ensure only an admin can do this (requires protectAdmin guard)
        if (!req.admin || !req.admin.id) {
            return res.status(403).json({ success: false, message: "Not authorized as an admin" });
        }

        // Fetch db doc, not cache
        let settings = await SystemSettings.findOne();
        
        if (!settings) {
             settings = await SystemSettings.create({
                 isOnlinePaymentEnabled,
                 subscriptionMessage,
                 lastUpdatedBy: req.admin.id
             });
        } else {
             settings.isOnlinePaymentEnabled = isOnlinePaymentEnabled;
             if (subscriptionMessage !== undefined) {
                 settings.subscriptionMessage = subscriptionMessage;
             }
             settings.lastUpdatedBy = req.admin.id;
             await settings.save();
        }

        // Log the action
        await AdminLog.create({
            action: isOnlinePaymentEnabled ? 'PAYMENT_ENABLED' : 'PAYMENT_DISABLED',
            adminId: req.admin.id,
            details: {
                paymentEnabled: isOnlinePaymentEnabled,
                message: settings.subscriptionMessage
            }
        });

        // Clear the cache globally so future middleware calls pull the fresh data
        clearSettingsCache();

        res.status(200).json({ success: true, settings });
    } catch (error) {
        console.error("Error updating subscription settings", error);
        res.status(500).json({ success: false, message: "Server error while updating settings" });
    }
};

module.exports = {
    getSettings,
    updateSubscriptionStatus
};
