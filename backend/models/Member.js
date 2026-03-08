const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Cash', 'Online'], default: 'Cash' },
    remark: String
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
    age: {
        type: Number,
        min: [10, 'Age must be at least 10'],
        max: [80, 'Age cannot exceed 80']
    },
    weight: {
        type: Number,
        min: [20, 'Weight must be at least 20 kg'],
        max: [300, 'Weight cannot exceed 300 kg']
    },
    height: {
        type: Number,
        min: [50, 'Height must be at least 50 cm'],
        max: [250, 'Height cannot exceed 250 cm']
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
        enum: ['Active', 'Expired'],
        default: 'Active'
    }
}, { timestamps: true });

// Add compound index for efficient upcoming birthdays queries
memberSchema.index({ gym: 1, dob: 1 });

memberSchema.pre('validate', function() {
    if (this.mobile) {
        this.mobile = this.mobile.trim();
    }
});

const Member = mongoose.model('Member', memberSchema);
module.exports = Member;
