const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const gymOwnerSchema = new mongoose.Schema({
    ownerName: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        match: [/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits']
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: [8, 'Password must be at least 8 characters long']
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym'
    },
    role: {
        type: String,
        default: 'owner'
    }
}, { timestamps: true });

// Explicit Indexes for performance and uniqueness
gymOwnerSchema.index({ email: 1 }, { unique: true, sparse: true });
gymOwnerSchema.index({ mobile: 1 }, { unique: true });

gymOwnerSchema.pre('validate', function() {
    if (this.mobile) {
        this.mobile = this.mobile.trim();
    }
});

gymOwnerSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

gymOwnerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const GymOwner = mongoose.model('GymOwner', gymOwnerSchema);
module.exports = GymOwner;
