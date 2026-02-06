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
        unique: true
    },
    password: {
        type: String,
        required: true
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
