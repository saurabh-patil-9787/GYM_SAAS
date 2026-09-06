const Invoice = require('../models/Invoice');
const Gym = require('../models/Gym');
const Member = require('../models/Member');
const { sendToMember } = require('../utils/sseManager');

// ============================================================
// HELPER: derive gym from authenticated owner
// ============================================================
const getOwnerGym = async (req) => {
    const gym = await Gym.findOne({ owner: req.gymOwner._id });
    if (!gym) throw Object.assign(new Error('Gym not found'), { statusCode: 404 });
    return gym;
};

// ============================================================
// OWNER: GET Invoice Settings
// GET /api/invoices/settings
// ============================================================
const getInvoiceSettings = async (req, res, next) => {
    try {
        const gym = await getOwnerGym(req);
        res.json({
            gymName:         gym.gymName,
            logoUrl:         gym.logoUrl || null,
            invoiceSettings: gym.invoiceSettings || {}
        });
    } catch (err) {
        next(err);
    }
};

// ============================================================
// OWNER: UPDATE Invoice Settings
// PUT /api/invoices/settings
// ============================================================
const updateInvoiceSettings = async (req, res, next) => {
    try {
        const gym = await getOwnerGym(req);

        const allowed = ['address','mobile','email','gstEnabled','gstin','state','stateCode','gstRate','invoicePrefix','terms','footerNote'];
        const updates = {};
        allowed.forEach(key => {
            if (req.body[key] !== undefined) updates[`invoiceSettings.${key}`] = req.body[key];
        });

        await Gym.updateOne({ _id: gym._id }, { $set: updates });

        res.json({ message: 'Invoice settings saved successfully' });
    } catch (err) {
        next(err);
    }
};

// ============================================================
// OWNER: CREATE Invoice
// POST /api/invoices
// ============================================================
const createInvoice = async (req, res, next) => {
    try {
        const {
            memberId,
            paymentReference,
            invoiceDate,
            invoiceType,
            description,
            subtotal,
            discount,
            gstEnabled,
            gstRate,
            paymentMethod,
            transactionId,
            paymentStatus,
            notes
        } = req.body;

        if (!memberId)    return res.status(400).json({ message: 'Please select a member.' });
        if (!description) return res.status(400).json({ message: 'Description is required.' });
        if (subtotal == null || Number(subtotal) < 0) return res.status(400).json({ message: 'Please enter a valid amount.' });

        const gym = await getOwnerGym(req);

        // Verify member belongs to this gym
        const member = await Member.findOne({ _id: memberId, gym: gym._id }).select('name mobile memberId').lean();
        if (!member) return res.status(404).json({ message: 'Member not found in your gym.' });

        // Atomic increment — prevents race-condition duplicate numbers
        const updatedGym = await Gym.findOneAndUpdate(
            { _id: gym._id },
            { $inc: { nextInvoiceNumber: 1 } },
            { new: true }
        );

        const year   = new Date().getFullYear();
        const prefix = updatedGym.invoiceSettings?.invoicePrefix || 'INV';
        const seq    = String(updatedGym.nextInvoiceNumber).padStart(5, '0');
        const invoiceNumber = `${prefix}/${year}/${seq}`;

        // Amount calculations
        const sub      = Number(subtotal) || 0;
        const disc     = Number(discount)  || 0;
        const taxable  = Math.max(sub - disc, 0);

        let cgst = 0, sgst = 0, igst = 0;
        const useGst = gstEnabled && updatedGym.invoiceSettings?.gstEnabled;
        const rate   = useGst ? (Number(gstRate) || updatedGym.invoiceSettings?.gstRate || 18) : 0;

        if (useGst) {
            cgst = parseFloat(((taxable * rate) / 200).toFixed(2)); // half of GST rate
            sgst = cgst;
        }

        const total = parseFloat((taxable + cgst + sgst + igst).toFixed(2));

        const invoice = await Invoice.create({
            gym:            gym._id,
            member:         member._id,
            memberName:     member.name,
            memberMobile:   member.mobile,
            paymentReference: paymentReference || {},
            invoiceNumber,
            invoiceDate:    invoiceDate ? new Date(invoiceDate) : new Date(),
            invoiceType:    invoiceType || 'Membership',
            description,
            subtotal:       sub,
            discount:       disc,
            taxableAmount:  taxable,
            gstEnabled:     !!useGst,
            gstRate:        rate,
            cgst,
            sgst,
            igst,
            totalAmount:    total,
            paymentMethod:  paymentMethod || 'Cash',
            transactionId:  transactionId || null,
            paymentStatus:  paymentStatus  || 'PAID',
            notes:          notes || null
        });

        res.status(201).json({
            message: 'Invoice created successfully',
            invoice: {
                _id:           invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                totalAmount:   invoice.totalAmount,
                invoiceDate:   invoice.invoiceDate,
                paymentStatus: invoice.paymentStatus,
                memberName:    member.name,
                memberId:      member.memberId
            }
        });

        // SSE push to member — new invoice appeared (non-blocking, after response)
        sendToMember(String(member._id), 'invoice_created', {
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount
        });
    } catch (err) {
        // Duplicate key = race condition on invoice number (very rare)
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Invoice number conflict. Please try again.' });
        }
        next(err);
    }
};

// ============================================================
// OWNER: GET Recent Invoices (latest 3)
// GET /api/invoices/recent
// ============================================================
const getRecentInvoices = async (req, res, next) => {
    try {
        const gym = await getOwnerGym(req);
        const invoices = await Invoice.find({ gym: gym._id })
            .populate('member', 'name mobile memberId photoUrl')
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        res.json(invoices);
    } catch (err) {
        next(err);
    }
};

// ============================================================
// OWNER: GET Single Invoice by ID
// GET /api/invoices/:id
// ============================================================
const getInvoiceById = async (req, res, next) => {
    try {
        const gym = await getOwnerGym(req);
        const invoice = await Invoice.findOne({ _id: req.params.id, gym: gym._id })
            .populate('member', 'name mobile memberId photoUrl')
            .lean();
        if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
        res.json(invoice);
    } catch (err) {
        next(err);
    }
};

// ============================================================
// OWNER: GET All Invoices for a Member
// GET /api/invoices/member/:memberId
// ============================================================
const getMemberInvoices = async (req, res, next) => {
    try {
        const gym = await getOwnerGym(req);

        // Verify member belongs to this gym
        const member = await Member.findOne({ _id: req.params.memberId, gym: gym._id }).select('_id').lean();
        if (!member) return res.status(404).json({ message: 'Member not found in your gym.' });

        const invoices = await Invoice.find({ gym: gym._id, member: member._id })
            .sort({ createdAt: -1 })
            .lean();
        res.json(invoices);
    } catch (err) {
        next(err);
    }
};

// ============================================================
// MEMBER: GET Own Invoices
// GET /api/member/invoices   (uses protectMember)
// ============================================================
const getMyInvoices = async (req, res, next) => {
    try {
        const invoices = await Invoice.find({
            member: req.member._id,
            gym:    req.member.gym
        })
        .populate('member', 'name mobile memberId')
        .sort({ createdAt: -1 })
        .lean();
        res.json(invoices);
    } catch (err) {
        next(err);
    }
};

// ============================================================
// MEMBER: GET Single Invoice (own only)
// GET /api/member/invoices/:id   (uses protectMember)
// ============================================================
const getMyInvoiceById = async (req, res, next) => {
    try {
        const invoice = await Invoice.findOne({
            _id:    req.params.id,
            member: req.member._id,
            gym:    req.member.gym
        })
        .populate('member', 'name mobile memberId')
        .lean();
        if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
        res.json(invoice);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getInvoiceSettings,
    updateInvoiceSettings,
    createInvoice,
    getRecentInvoices,
    getInvoiceById,
    getMemberInvoices,
    getMyInvoices,
    getMyInvoiceById
};
