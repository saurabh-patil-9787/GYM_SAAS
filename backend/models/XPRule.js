const mongoose = require('mongoose');

const xpRuleSchema = new mongoose.Schema({
    gym: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Gym', 
        default: null // Null means it's a global rule applicable to all gyms
    }, 
    actionType: { 
        type: String, 
        required: true,
        enum: ['login', 'workout', 'water', 'attendance', 'stretch', 'daily_mission_complete']
    }, 
    points: { 
        type: Number, 
        required: true 
    },
    limitPerDay: { 
        type: Number, 
        default: 1 // Idempotency control, how many times this can be awarded per day
    }, 
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

xpRuleSchema.index({ gym: 1, actionType: 1 });

const XPRule = mongoose.model('XPRule', xpRuleSchema);
module.exports = XPRule;
