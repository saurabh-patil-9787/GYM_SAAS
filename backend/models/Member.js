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
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    age: Number,
    weight: Number,
    height: Number,
    city: String,
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

const Member = mongoose.model('Member', memberSchema);
module.exports = Member;
