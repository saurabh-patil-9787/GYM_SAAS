const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    category: {
        type: String,
        enum: ['Protein', 'Supplements', 'Nutrition', 'Accessories', 'Clothing', 'Other'],
        default: 'Other'
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    mrp: {
        type: Number,
        default: null,
        min: [0, 'MRP cannot be negative']
    },
    image: {
        url: { type: String, default: null },
        key: { type: String, default: null },
        provider: { type: String, default: 'r2' }
    },
    // Per-product WhatsApp override (optional — falls back to gym.whatsappNumber or owner.mobile)
    whatsappOverride: {
        type: String,
        default: null,
        trim: true,
        match: [/^[0-9]{10}$/, 'WhatsApp override must be exactly 10 digits']
    },
    stockStatus: {
        type: String,
        enum: ['IN_STOCK', 'OUT_OF_STOCK'],
        default: 'IN_STOCK'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Indexes for fast multi-tenant queries
productSchema.index({ gym: 1, isActive: 1 });
productSchema.index({ gym: 1, isFeatured: 1, isActive: 1 });
productSchema.index({ gym: 1, displayOrder: 1 });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
