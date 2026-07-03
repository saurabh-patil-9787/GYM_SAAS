const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    }, // e.g., "Monthly Champion"
    description: {
        type: String
    },
    iconUrl: {
        type: String
    },
    tier: { 
        type: String, 
        enum: ['bronze', 'silver', 'gold', 'diamond', 'champion'],
        default: 'bronze'
    },
    // Optional: If badge is specific to a gym
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        default: null
    }
}, { timestamps: true });

const Badge = mongoose.model('Badge', badgeSchema);
module.exports = Badge;
