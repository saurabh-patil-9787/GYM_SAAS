const mongoose = require('mongoose');

const memberPasswordResetRequestSchema = new mongoose.Schema({
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
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GymOwner',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'EXPIRED'],
        default: 'PENDING'
    },
    // statusTokenHash removed
    temporaryPasswordHash: {
        type: String,
        default: null
    },
    temporaryPasswordExpiresAt: {
        type: Date,
        default: null
    },
    failedAttempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 5
    },
    lastFailedAttemptAt: {
        type: Date,
        default: null
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GymOwner',
        default: null
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GymOwner',
        default: null
    },
    regeneratedAt: {
        type: Date,
        default: null
    },
    regenerationCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Create indexes for fast querying
memberPasswordResetRequestSchema.index({ gym: 1, status: 1 });
// memberPasswordResetRequestSchema.index({ statusTokenHash: 1 });
memberPasswordResetRequestSchema.index({ member: 1, status: 1 });

const MemberPasswordResetRequest = mongoose.model('MemberPasswordResetRequest', memberPasswordResetRequestSchema);
module.exports = MemberPasswordResetRequest;
