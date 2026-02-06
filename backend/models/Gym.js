const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GymOwner',
        required: true
    },
    gymName: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    nextMemberId: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

const Gym = mongoose.model('Gym', gymSchema);
module.exports = Gym;
