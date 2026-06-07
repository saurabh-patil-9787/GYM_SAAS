const mongoose = require('mongoose');

const notificationAuditLogSchema = new mongoose.Schema({
    fcmToken: { type: String },
    title: { type: String },
    body: { type: String },
    status: { type: String, enum: ['sent', 'failed', 'invalid_token'] },
    error: { type: String }
}, { timestamps: true });

// Add index for easy querying by status and timestamp
notificationAuditLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationAuditLog', notificationAuditLogSchema);
