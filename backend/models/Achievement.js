const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    member: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Member',
        required: true
    },
    badge: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Badge',
        required: true
    },
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true
    },
    unlockedAt: { 
        type: Date, 
        default: Date.now 
    }
});

achievementSchema.index({ member: 1, badge: 1 }, { unique: true });

const Achievement = mongoose.model('Achievement', achievementSchema);
module.exports = Achievement;
