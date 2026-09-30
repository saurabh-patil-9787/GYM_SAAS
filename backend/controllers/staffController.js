const GymOwner = require('../models/GymOwner');
const Gym = require('../models/Gym');

// @desc    Create a new staff account
// @route   POST /api/staff
// @access  Private - owner only
const createStaff = async (req, res, next) => {
    const { name, mobile, password, canViewRevenue } = req.body;
    try {
        if (!name || !mobile || !password) {
            return res.status(400).json({ message: 'Name, mobile and password are required' });
        }
        if (!/^[0-9]{10}$/.test(mobile.trim())) {
            return res.status(400).json({ message: 'Mobile number must be exactly 10 digits' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        const gymDoc = await Gym.findOne({ owner: req.user._id });
        if (!gymDoc) {
            return res.status(400).json({ message: 'No gym associated with your account' });
        }
        const existing = await GymOwner.findOne({ mobile: mobile.trim() });
        if (existing) {
            return res.status(409).json({ message: 'This mobile number is already in use' });
        }
        const staff = await GymOwner.create({
            ownerName: name.trim(),
            mobile: mobile.trim(),
            password,
            role: 'staff',
            gym: gymDoc._id,
            createdBy: req.user._id,
            permissions: { canViewRevenue: canViewRevenue !== false }
        });
        res.status(201).json({
            _id: staff._id,
            name: staff.ownerName,
            mobile: staff.mobile,
            role: staff.role,
            canViewRevenue: staff.permissions.canViewRevenue,
            createdAt: staff.createdAt
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all staff for this owner
// @route   GET /api/staff
// @access  Private - owner only
const getStaff = async (req, res, next) => {
    try {
        const staffList = await GymOwner.find({ createdBy: req.user._id, role: 'staff' })
            .select('ownerName mobile permissions createdAt').lean();
        const formatted = staffList.map(s => ({
            _id: s._id,
            name: s.ownerName,
            mobile: s.mobile,
            canViewRevenue: s.permissions?.canViewRevenue ?? true,
            createdAt: s.createdAt
        }));
        res.json(formatted);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a staff account
// @route   PUT /api/staff/:id
// @access  Private - owner only
const updateStaff = async (req, res, next) => {
    const { name, mobile, password, canViewRevenue } = req.body;
    try {
        const staff = await GymOwner.findOne({ _id: req.params.id, createdBy: req.user._id, role: 'staff' });
        if (!staff) return res.status(404).json({ message: 'Staff member not found' });

        if (mobile && mobile.trim() !== staff.mobile) {
            if (!/^[0-9]{10}$/.test(mobile.trim())) {
                return res.status(400).json({ message: 'Mobile number must be exactly 10 digits' });
            }
            const existing = await GymOwner.findOne({ mobile: mobile.trim(), _id: { $ne: staff._id } });
            if (existing) return res.status(409).json({ message: 'This mobile number is already in use' });
            staff.mobile = mobile.trim();
        }
        if (name) staff.ownerName = name.trim();
        if (password) {
            if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
            staff.password = password;
        }
        if (canViewRevenue !== undefined) {
            staff.permissions = { ...staff.permissions, canViewRevenue: !!canViewRevenue };
        }
        const updated = await staff.save();
        res.json({
            _id: updated._id,
            name: updated.ownerName,
            mobile: updated.mobile,
            canViewRevenue: updated.permissions?.canViewRevenue ?? true,
            createdAt: updated.createdAt
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a staff account
// @route   DELETE /api/staff/:id
// @access  Private - owner only
const deleteStaff = async (req, res, next) => {
    try {
        const staff = await GymOwner.findOne({ _id: req.params.id, createdBy: req.user._id, role: 'staff' });
        if (!staff) return res.status(404).json({ message: 'Staff member not found' });
        await GymOwner.deleteOne({ _id: staff._id });
        res.json({ message: 'Staff member removed successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createStaff, getStaff, updateStaff, deleteStaff };
