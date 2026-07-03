const mongoose = require('mongoose');

const xpHistorySchema = new mongoose.Schema({
    gym: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Gym',
        required: true
    },
    member: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Member',
        required: true
    },
    activityType: { 
        type: String, 
        required: true 
    },
    points: { 
        type: Number, 
        required: true 
    },
    reason: { 
        type: String 
    }, 
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// For leaderboard aggregation and history checks
xpHistorySchema.index({ gym: 1, member: 1, createdAt: -1 });
// For idempotency checks (e.g. did they do this action today?)
xpHistorySchema.index({ member: 1, activityType: 1, createdAt: -1 });

const XPHistory = mongoose.model('XPHistory', xpHistorySchema);
module.exports = XPHistory;
