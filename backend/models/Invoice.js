const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    // Denormalized snapshot so "Bill To" data survives member deletion / edits
    memberName:     { type: String, default: '' },
    memberMobile:   { type: String, default: '' },
    // Snapshot of the linked payment at time of generation
    paymentReference: {
        paymentId:  { type: String, default: null },
        date:       { type: Date,   default: null },
        amount:     { type: Number, default: null },
        type:       { type: String, default: null },
        remark:     { type: String, default: null }
    },
    // Backend-generated, unique per gym
    invoiceNumber:  { type: String, required: true },
    invoiceDate:    { type: Date,   default: Date.now },
    invoiceType: {
        type: String,
        enum: ['Membership', 'New Membership', 'Renewal', 'Registration', 'Other'],
        default: 'Membership'
    },
    description:    { type: String, required: true },

    // Amount breakdown
    subtotal:       { type: Number, required: true, min: 0 },
    discount:       { type: Number, default: 0, min: 0 },
    taxableAmount:  { type: Number, required: true, min: 0 },

    // GST (only populated when gstEnabled = true)
    gstEnabled:     { type: Boolean, default: false },
    gstRate:        { type: Number, default: 0 },   // e.g. 18
    cgst:           { type: Number, default: 0 },
    sgst:           { type: Number, default: 0 },
    igst:           { type: Number, default: 0 },

    totalAmount:    { type: Number, required: true, min: 0 },

    // Payment details
    paymentMethod: {
        type: String,
        enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Online', 'Other'],
        default: 'Cash'
    },
    transactionId:  { type: String, default: null },
    paymentStatus: {
        type: String,
        enum: ['PAID', 'PENDING'],
        default: 'PAID'
    },
    notes:          { type: String, default: null }

}, { timestamps: true });

// Fast recent-invoices query (owner dashboard)
invoiceSchema.index({ gym: 1, createdAt: -1 });
// Fast member-specific query
invoiceSchema.index({ gym: 1, member: 1, createdAt: -1 });
// Unique invoice number per gym (prevents race-condition duplicates slipping through)
invoiceSchema.index({ gym: 1, invoiceNumber: 1 }, { unique: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
