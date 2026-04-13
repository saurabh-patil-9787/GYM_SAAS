const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    isOnlinePaymentEnabled: {
        type: Boolean,
        default: true
    },
    subscriptionMessage: {
        type: String,
        default: "Online payment is currently stopped. Please connect with admin for plan renewal."
    },
    configKey: {
        type: String,
        default: 'GLOBAL',
        unique: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
module.exports = SystemSettings;
