const mongoose = require('mongoose');

const levelProgressionSchema = new mongoose.Schema({
    level: { 
        type: Number, 
        required: true,
        unique: true
    },
    xpThreshold: { 
        type: Number, 
        required: true 
    },
    title: { 
        type: String // e.g., "Beginner", "Iron Lifter"
    },
    badgeUrl: {
        type: String
    }
});

const LevelProgression = mongoose.model('LevelProgression', levelProgressionSchema);
module.exports = LevelProgression;
