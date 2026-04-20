const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GymOwner',
        required: true
    },
    gymName: {
        type: String,
        required: true,
        maxlength: [100, 'Gym name cannot exceed 100 characters']
    },
    city: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    logoUrl: {
        type: String,
        default: null
    },
    logoPublicId: {
        type: String,
        default: null
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
    planStatus: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED'],
        default: 'ACTIVE'
    },
    planType: {
        type: String,
        enum: ['Monthly', 'Yearly', 'Trial'],
        default: 'Monthly'
    },
    planStartDate: {
        type: Date
    },
    paymentId: {
        type: String
    },
    nextMemberId: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

// AUDIT FIX 1: Index on owner field — prevents full collection scan in requireActivePlan middleware on every protected request
gymSchema.index({ owner: 1 }, { unique: true });

const Gym = mongoose.model('Gym', gymSchema);
module.exports = Gym;
