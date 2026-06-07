const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const paymentSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Cash', 'Online'], default: 'Cash' },
    remark: String,
    transactionType: { type: String, enum: ["registration", "renewal", "due", "other"], default: "other" },
    plan: String,
    remainingDue: Number
});

const memberSchema = new mongoose.Schema({
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true
    },
    memberId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        match: [/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits']
    },
    // --- PWA Member Auth Fields ---
    password: {
        type: String,
        default: null // null for owner-added members (no self-login until password is set)
    },
    registrationStatus: {
        type: String,
        enum: ['approved', 'awaiting_approval', 'rejected'],
        default: 'approved' // owner-added members are auto-approved
    },
    registeredVia: {
        type: String,
        enum: ['owner', 'self'],
        default: 'owner'
    },
    // --- End PWA Fields ---
    age: {
        type: Number,
        validate: {
            validator: function(val) {
                if (val === undefined || val === null) return true;
                return Number.isInteger(val) && val >= 10 && val <= 80;
            },
            message: 'Age must be a rounded number between 10 and 80'
        }
    },
    weight: {
        type: Number,
        validate: {
            validator: function(val) {
                if (val === undefined || val === null) return true;
                return Number.isInteger(val) && val >= 20 && val <= 300;
            },
            message: 'Weight must be a rounded number between 20 and 300 kg'
        }
    },
    height: {
        type: Number,
        validate: {
            validator: function(val) {
                if (val === undefined || val === null) return true;
                return Number.isInteger(val) && val >= 50 && val <= 250;
            },
            message: 'Height must be a rounded number between 50 and 250 cm'
        }
    },
    city: {
        type: String,
        maxlength: [50, 'City name cannot exceed 50 characters']
    },
    dob: {
        type: Date,
        default: null
    },
    photoUrl: {
        type: String,
        default: null
    },
    photoPublicId: {
        type: String,
        default: null
    },
    planDuration: {
        type: Number, // in months
        required: true
    },
    planName: {
        type: String, // Human-readable plan name e.g. "Gold Plan"
        default: null
    },
    requestedPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        default: null
    },
    joiningDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    totalFee: {
        type: Number,
        required: true
    },
    paidFee: {
        type: Number,
        default: 0
    },
    paymentHistory: [paymentSchema],
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Inactive'],
        default: 'Active'
    },
    // --- FCM Push Notification Tokens ---
    fcmTokens: [{
        token: { type: String, required: true },
        device: { type: String, default: 'web' },
        lastUsed: { type: Date, default: Date.now }
    }],
    // --- Phase 1 & 2: Fitness Profile Fields ---
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: null
    },
    activityLevel: {
        type: String,
        enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
        default: null
    },
    fitnessGoal: {
        type: String,
        enum: ['lose_weight', 'gain_muscle', 'maintain'],
        default: null
    },
    goalWeight: {
        type: Number,
        default: null
    },
    targetDate: {
        type: Date,
        default: null
    },
    // Phase 1 — 1RM Personal Records
    personalRecords: [{
        exercise: { type: String, required: true },
        oneRM: { type: Number, required: true },
        date: { type: Date, default: Date.now }
    }],
    // Phase 2 — Body Progress Logs
    progressLogs: [{
        date: { type: Date, default: Date.now },
        weight: { type: Number, required: true },
        waist: { type: Number, default: null },
        chest: { type: Number, default: null },
        hip: { type: Number, default: null },
        arms: { type: Number, default: null },
        thighs: { type: Number, default: null },
        notes: { type: String, default: '' }
    }],
    // Phase 2 — Daily Gym Check-ins (self-reported)
    checkIns: [{
        date: { type: String, required: true } // YYYY-MM-DD string for easy date comparison
    }],
    // Phase 2 — Gamification: Unlocked Achievement Badges
    unlockedBadges: [{
        badgeId: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now }
    }],
    // Phase 4 — Preferred workout time (HH:MM)
    preferredWorkoutTime: {
        type: String,
        default: '07:00'
    },
    // --- Notification Preferences (extended for Phase 4 habit reminders) ---
    notificationPreferences: {
        renewalReminders: { type: Boolean, default: true },
        paymentAlerts: { type: Boolean, default: true },
        gymAnnouncements: { type: Boolean, default: true },
        gymDayReminder: { type: Boolean, default: true },
        waterReminder: { type: Boolean, default: true },
        measurementReminder: { type: Boolean, default: true },
        weeklyGoalCheckin: { type: Boolean, default: true }
    }
}, { timestamps: true });

// Hash password before saving (only when password is modified and set)
memberSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
memberSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// Add performance indexes
memberSchema.index({ gym: 1 });
memberSchema.index({ gym: 1, mobile: 1 }); // Exact match index
memberSchema.index({ gym: 1, memberId: 1 }); // Exact match index
memberSchema.index({ gym: 1, name: 1 }); // Partial match index support
memberSchema.index({ gym: 1, expiryDate: 1 });
memberSchema.index({ gym: 1, dob: 1 });
memberSchema.index({ gym: 1, 'paymentHistory.date': -1 });
memberSchema.index({ gym: 1, createdAt: -1, _id: -1 }); // Default fallback safe-sort index
memberSchema.index({ gym: 1, registrationStatus: 1 }); // For pending approval queries
memberSchema.index({ gym: 1, planName: 1 }); // For plan name queries

memberSchema.pre('validate', function() {
    if (this.mobile) {
        this.mobile = this.mobile.trim();
    }
});

const Member = mongoose.model('Member', memberSchema);
module.exports = Member;
