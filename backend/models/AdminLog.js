const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['PAYMENT_DISABLED', 'PAYMENT_ENABLED', 'MESSAGE_UPDATED', 'SETTINGS_INITIALIZED']
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    details: {
        type: Object
    }
}, { timestamps: true });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
module.exports = AdminLog;
