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
    },
    // --- Razorpay Per-Gym Payment Config ---
    razorpayKeyId: {
        type: String,
        default: null
    },
    razorpayKeySecret: {
        type: String, // Stored ENCRYPTED (AES-256-GCM) — never exposed to frontend
        default: null
    },
    onlinePaymentsEnabled: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// AUDIT FIX 1: Index on owner field — prevents full collection scan in requireActivePlan middleware on every protected request
gymSchema.index({ owner: 1 }, { unique: true });
// Index for gym search by name (member PWA)
gymSchema.index({ gymName: 'text' });
gymSchema.index({ isActive: 1 });

const Gym = mongoose.model('Gym', gymSchema);
module.exports = Gym;
