const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true
    },
    planName: {
        type: String,
        required: [true, 'Plan name is required'],
        maxlength: [100, 'Plan name cannot exceed 100 characters'],
        trim: true
    },
    duration: {
        type: Number, // in months: 1, 3, 6, 12
        required: [true, 'Duration is required'],
        enum: {
            values: [1, 3, 6, 12],
            message: 'Duration must be 1, 3, 6, or 12 months'
        }
    },
    price: {
        type: Number, // in INR
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

// Performance indexes
planSchema.index({ gym: 1, status: 1 });
planSchema.index({ gym: 1 });

const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;
