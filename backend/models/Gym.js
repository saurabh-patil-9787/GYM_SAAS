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
    logoProvider: {
        type: String,
        enum: ['cloudinary', 'r2'],
        default: 'cloudinary'
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
    },
    // --- Store WhatsApp Number ---
    // Optional: gym's business WhatsApp number for product orders.
    // Falls back to owner.mobile if not set.
    whatsappNumber: {
        type: String,
        default: null,
        trim: true,
        match: [/^[0-9]{10}$/, 'WhatsApp number must be exactly 10 digits']
    },
    // --- Invoice Settings (embedded to avoid extra collection) ---
    nextInvoiceNumber: {
        type: Number,
        default: 1
    },
    invoiceSettings: {
        address:       { type: String, default: null },
        mobile:        { type: String, default: null },
        email:         { type: String, default: null },
        gstEnabled:    { type: Boolean, default: false },
        gstin:         { type: String, default: null },
        state:         { type: String, default: null },
        stateCode:     { type: String, default: null },
        gstRate:       { type: Number, default: 18 },
        invoicePrefix: { type: String, default: 'INV' },
        terms:         { type: String, default: null },
        footerNote:    { type: String, default: null }
    }
}, { timestamps: true });

// AUDIT FIX 1: Index on owner field — prevents full collection scan in requireActivePlan middleware on every protected request
gymSchema.index({ owner: 1 }, { unique: true });
// Index for gym search by name (member PWA)
gymSchema.index({ gymName: 'text' });
gymSchema.index({ isActive: 1 });

const Gym = mongoose.model('Gym', gymSchema);
module.exports = Gym;
