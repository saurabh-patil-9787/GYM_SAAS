const { getSettingsCached } = require('../services/settingsService');

const checkSubscriptionEnabled = async (req, res, next) => {
    try {
        const settings = await getSettingsCached();

        if (!settings.isOnlinePaymentEnabled) {
            return res.status(403).json({
                success: false,
                message: settings.subscriptionMessage || "Online payments have been temporarily disabled by the administrator."
            });
        }

        next();
    } catch (error) {
        console.error("Error in checkSubscriptionEnabled middleware:", error);
        res.status(500).json({ success: false, message: "Internal Server Error verifying subscription status" });
    }
};

module.exports = { checkSubscriptionEnabled };
