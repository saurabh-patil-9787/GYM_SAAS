const mongoose = require('mongoose');

const dailyMissionSchema = new mongoose.Schema({
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
    date: { 
        type: String, // YYYY-MM-DD
        required: true
    }, 
    tasks: [{
        type: { 
            type: String, 
            enum: ['workout', 'water', 'attendance', 'stretch'] 
        },
        isCompleted: { 
            type: Boolean, 
            default: false 
        }
    }],
    isRewardClaimed: { 
        type: Boolean, 
        default: false 
    },
    rewardXP: { 
        type: Number, 
        default: 50 
    }
}, { timestamps: true });

dailyMissionSchema.index({ member: 1, date: 1 }, { unique: true });

const DailyMission = mongoose.model('DailyMission', dailyMissionSchema);
module.exports = DailyMission;
