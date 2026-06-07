const mongoose = require('mongoose');

const renewalRequestSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    // Type of renewal request
    requestType: {
        type: String,
        enum: ['fresh_start'],
        required: true
    },
    // Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // Denormalized plan info (so we have it even if plan changes)
    planName: String,
    planDuration: Number,
    planPrice: Number,
    // Owner action tracking
    processedAt: Date,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GymOwner'
    },
    rejectionReason: String
}, { timestamps: true });

// Ensure a member can only have one pending request per gym
renewalRequestSchema.index({ member: 1, gym: 1, status: 1 });
renewalRequestSchema.index({ gym: 1, status: 1, createdAt: -1 });

const RenewalRequest = mongoose.model('RenewalRequest', renewalRequestSchema);
module.exports = RenewalRequest;
