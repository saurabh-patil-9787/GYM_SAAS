const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Target — who receives this notification
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recipientType'
    },
    recipientType: {
        type: String,
        enum: ['Member', 'GymOwner'],
        required: true
    },
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true
    },
    // Content
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    type: {
        type: String,
        enum: [
            // Member receives (sent by owner actions)
            'registration_approved',
            'registration_rejected',
            'payment_recorded',
            'renewal_approved',
            'fresh_start_approved',
            'fresh_start_rejected',
            'online_payment_received',  // member online payment confirmed
            'membership_expired',
            'renewal_reminder',         // cron-sent reminders
            'gym_announcement',

            // Owner receives (sent by member actions)
            'new_registration_request', // member self-registered
            'fresh_start_request',      // member requested fresh start
            'member_stopped',           // member stopped gym
            'member_rejoined',          // member rejoined
        ],
        required: true
    },
    // State
    isRead: {
        type: Boolean,
        default: false
    },
    deliveryStatus: {
        type: String,
        enum: ['sent', 'delivered', 'clicked', 'ignored'],
        default: 'sent'
    },
    deliveredAt: {
        type: Date,
        default: null
    },
    clickedAt: {
        type: Date,
        default: null
    },
    ignoredAt: {
        type: Date,
        default: null
    },
    // Optional reference
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    referenceModel: {
        type: String,
        enum: ['Member', 'Plan', null],
        default: null
    }
}, { timestamps: true });

// Indexes for fast lookups
notificationSchema.index({ recipient: 1, recipientType: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ gym: 1, recipientType: 1, createdAt: -1 });

// TTL index: Automatically delete notifications older than 90 days.
// This prevents the notifications collection from growing indefinitely.
// MongoDB's background task checks this roughly every 60 seconds.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90 days

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
