const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
    gym: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Gym', 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['monthly', 'weekly'], 
        required: true 
    },
    periodString: { 
        type: String, 
        required: true 
    }, // e.g., "July 2026" or "Week 28 2026"
    top3: [{
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
        name: String,
        photoUrl: String,
        xp: Number,
        rank: Number
    }],
    snapshotDate: { 
        type: Date, 
        default: Date.now 
    }
});

snapshotSchema.index({ gym: 1, type: 1, periodString: 1 });

const LeaderboardSnapshot = mongoose.model('LeaderboardSnapshot', snapshotSchema);
module.exports = LeaderboardSnapshot;
