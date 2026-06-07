const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'userType',
        required: true
    },
    userType: {
        type: String,
        enum: ['GymOwner', 'Admin', 'Member'],
        default: 'GymOwner'
    },
    expires: {
        type: Date,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    createdByIp: String,
    revoked: Date,
    revokedByIp: String,
    replacedByToken: String
});

refreshTokenSchema.virtual('isExpired').get(function () {
    return Date.now() >= this.expires;
});

refreshTokenSchema.virtual('isActive').get(function () {
    return !this.revoked && !this.isExpired;
});

// SECURITY FIX: Index on token field — every auth request queries by token.
// Without this, each login/refresh is a full collection scan.
refreshTokenSchema.index({ token: 1 }, { unique: true });

// Performance index for user-based token lookups (logout, cleanup)
refreshTokenSchema.index({ user: 1, userType: 1 });

// TTL index: MongoDB automatically deletes documents once 'expires' is in the past.
// This keeps the RefreshToken collection clean without a manual cron job.
// Note: TTL is checked by MongoDB every 60 seconds, not exact-to-the-second.
refreshTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
