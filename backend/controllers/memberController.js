const Member = require('../models/Member');
const Gym = require('../models/Gym');
const cloudinary = require('../utils/cloudinary');


// =============================
// ADD NEW MEMBER
// =============================
const addMember = async (req, res, next) => {
    try {
        const { name, mobile, age, weight, height, city, planDuration, totalFee, paidFee, joiningDate, dob } = req.body || {};
        
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const gym = await Gym.findById(req.gymOwner.gym);
        if (!gym) {
            return res.status(400).json({ message: 'Gym not found. Please setup gym first.' });
        }

        const joinDateObj = new Date(joiningDate || Date.now());

        let expiryDateObj;
        if (req.body.expiryDate) {
            expiryDateObj = new Date(req.body.expiryDate);
        } else {
            expiryDateObj = new Date(joinDateObj);
            expiryDateObj.setMonth(expiryDateObj.getMonth() + Number(planDuration));
        }

        const member = await Member.create({
            gym: gym._id,
            memberId: gym.nextMemberId,
            name,
            mobile,
            age,
            weight,
            height,
            city,
            dob: dob ? new Date(dob) : null,
            photoUrl: req.file ? (req.file.path || req.file.secure_url || req.file.url) : null,
            photoPublicId: req.file ? req.file.filename : null,
            planDuration,
            joiningDate: joinDateObj,
            expiryDate: expiryDateObj,
            totalFee: Number(totalFee),
            paidFee: Number(paidFee) || 0,
            paymentHistory: paidFee > 0 ? [{
                amount: Number(paidFee),
                date: Date.now(),
                type: 'Cash'
            }] : [],
            status: 'Active'
        });

        gym.nextMemberId += 1;
        await gym.save();

        res.status(201).json(member);

    } catch (error) {
        next(error);
    }
};


// =============================
// GET MEMBERS (WITH FILTERS)
// =============================
const getMembers = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        let query = { gym: req.gymOwner.gym };

        const today = new Date();
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(today.getDate() + 5);

        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        // Status Filters
        if (status === 'active') {
            query.expiryDate = { $gte: today };
        }
        else if (status === 'expired') {
            query.expiryDate = { $lt: today };
        }
        else if (status === 'expiring_soon') {
            query.expiryDate = { $gte: today, $lte: fiveDaysFromNow };
        }
        else if (status === 'expiring_1day') {
            query.expiryDate = { $gte: today, $lte: tomorrow };
        }
        else if (status === 'amount_pending') {
            query.$expr = { $lt: [{ $ifNull: ['$paidFee', 0] }, { $ifNull: ['$totalFee', 0] }] };
        }
        else if (status === 'due') {
            query.$or = [
                { expiryDate: { $lt: today } },
                { $expr: { $lt: [{ $ifNull: ['$paidFee', 0] }, { $ifNull: ['$totalFee', 0] }] } }
            ];
        }

        // Search by name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const members = await Member.find(query).sort({ memberId: -1 }).lean();

        const membersWithData = members.map(m => {
            const isPlanExpired = new Date(m.expiryDate) < today;

            const isExpiringSoon =
                new Date(m.expiryDate) >= today &&
                new Date(m.expiryDate) <= fiveDaysFromNow;

            const isExpiring1Day =
                new Date(m.expiryDate) >= today &&
                new Date(m.expiryDate) <= tomorrow;

            const pendingAmount = Math.max(
                (Number(m.totalFee) || 0) - (Number(m.paidFee) || 0),
                0
            );

            return {
                ...m,
                isPlanExpired,
                isExpiringSoon,
                isExpiring1Day,
                pendingAmount
            };
        });

        res.json(membersWithData);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// =============================
// UPDATE MEMBER
// =============================
const updateMember = async (req, res, next) => {
    try {
        const member = await Member.findOne({ _id: req.params.id, gym: req.gymOwner.gym });
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Handle Photo Deletion from FormData
        if (req.body.removePhoto === 'true' && member.photoPublicId) {
            try {
                await cloudinary.uploader.destroy(member.photoPublicId);
            } catch (err) {
                console.error("Cloudinary destroy error:", err);
            }
            member.photoUrl = null;
            member.photoPublicId = null;
        }

        // Handle New Photo Upload
        if (req.file) {
            // Delete old photo if exists
            if (member.photoPublicId) {
                try {
                    await cloudinary.uploader.destroy(member.photoPublicId);
                } catch (err) {
                    console.error("Cloudinary destroy error:", err);
                }
            }
            member.photoUrl = req.file.path || req.file.secure_url || req.file.url;
            member.photoPublicId = req.file.filename;
        }

        // Update other fields
        const fieldsToUpdate = ['name', 'mobile', 'age', 'weight', 'height', 'city', 'dob'];
        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'dob') {
                    member.dob = req.body.dob ? new Date(req.body.dob) : null;
                } else {
                    member[field] = req.body[field];
                }
            }
        });

        await member.save();
        res.json(member);

    } catch (error) {
        next(error);
    }
};


// =============================
// ADD PAYMENT
// =============================
const addPayment = async (req, res, next) => {
    const { amount, type } = req.body;

    try {
        const member = await Member.findOne({
            _id: req.params.id,
            gym: req.gymOwner.gym
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const paymentAmount = Number(amount);

        member.paidFee = (Number(member.paidFee) || 0) + paymentAmount;

        member.paymentHistory.push({
            amount: paymentAmount,
            type: type || 'Cash',
            date: Date.now()
        });

        await member.save();

        res.json(member);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// =============================
// DELETE MEMBER
// =============================
const deleteMember = async (req, res, next) => {
    try {
        const member = await Member.findOne({
            _id: req.params.id,
            gym: req.gymOwner.gym
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Check if member has a profile photo to delete safely
        if (member.photoPublicId) {
            try {
                await cloudinary.uploader.destroy(member.photoPublicId);
            } catch (err) {
                console.error("Cloudinary destroy error:", err);
            }
        }

        await Member.deleteOne({ _id: member._id });
        res.json({ message: 'Member removed successfully' });

    } catch (error) {
        next(error);
    }
};


// =============================
// RENEW MEMBERSHIP
// =============================
const renewMember = async (req, res, next) => {
    const { planDuration, totalFee, paidFee } = req.body;

    try {
        const member = await Member.findOne({
            _id: req.params.id,
            gym: req.gymOwner.gym
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const currentExpiry =
            new Date(member.expiryDate) > new Date()
                ? new Date(member.expiryDate)
                : new Date();

        const newExpiry = new Date(currentExpiry);
        newExpiry.setMonth(newExpiry.getMonth() + Number(planDuration));

        member.planDuration = planDuration;
        member.expiryDate = newExpiry;

        // Add new plan fee
        member.totalFee = (Number(member.totalFee) || 0) + Number(totalFee);

        // Add payment if any
        if (paidFee && Number(paidFee) > 0) {
            member.paidFee = (Number(member.paidFee) || 0) + Number(paidFee);

            member.paymentHistory.push({
                amount: Number(paidFee),
                type: 'Cash',
                date: Date.now(),
                remark: 'Renewal'
            });
        }

        member.status = 'Active';

        await member.save();

        res.json(member);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// =============================
// ADMIN: GET MEMBERS BY GYM
// =============================
const getMembersByGymId = async (req, res, next) => {
    try {
        const { gymId } = req.params;

        const members = await Member.find({ gym: gymId }).sort({ memberId: -1 }).lean();

        const membersWithData = members.map(m => {
            const isPlanExpired = new Date(m.expiryDate) < new Date();
            const pendingAmount = Math.max(
                (Number(m.totalFee) || 0) - (Number(m.paidFee) || 0),
                0
            );

            return {
                ...m,
                isPlanExpired,
                pendingAmount
            };
        });

        res.json(membersWithData);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const mongoose = require('mongoose');

// =============================
// GET UPCOMING BIRTHDAYS
// =============================
const getUpcomingBirthdays = async (req, res, next) => {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        
        // Target object structure to get next 10 days wrapping around months
        const targetDates = [];
        for (let i = 0; i <= 10; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            targetDates.push({
                month: date.getMonth() + 1,
                day: date.getDate()
            });
        }

        // MongoDB Aggregation logic to extract month/day from DOB
        const gymObjId = new mongoose.Types.ObjectId(req.gymOwner.gym);
        const members = await Member.aggregate([
            {
                $match: {
                    gym: gymObjId,
                    dob: { $ne: null },
                    status: 'Active'
                }
            },
            {
                $project: {
                    name: 1,
                    mobile: 1,
                    photoUrl: 1,
                    dob: 1,
                    month: { $month: "$dob" },
                    day: { $dayOfMonth: "$dob" }
                }
            },
            {
                $match: {
                    $or: targetDates.map(td => ({ month: td.month, day: td.day }))
                }
            }
        ]);

        // Map and sort results
        const result = members.map(m => {
            const dobThisYear = new Date(today.getFullYear(), m.month - 1, m.day);
            if (dobThisYear < today && today.getDate() !== m.day) {
                dobThisYear.setFullYear(today.getFullYear() + 1);
            }
            
            const diffTime = dobThisYear.getTime() - today.getTime();
            let daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Handle today exactly
            if (m.month === currentMonth && m.day === currentDay) {
                daysRemaining = 0;
            }

            return {
                _id: m._id,
                name: m.name,
                mobile: m.mobile,
                photoUrl: m.photoUrl,
                dob: m.dob,
                daysRemaining
            };
        });

        result.sort((a, b) => a.daysRemaining - b.daysRemaining);

        res.json(result);
    } catch (error) {
        next(error);
    }
};

// =============================
// GET DASHBOARD STATS
// =============================
const getDashboardStats = async (req, res, next) => {
    try {
        const gymId = req.gymOwner.gym;
        
        const today = new Date();
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(today.getDate() + 5);

        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const [total, active, expired, expiringSoon, expiring1Day, amountPending] = await Promise.all([
            Member.countDocuments({ gym: gymId }),
            Member.countDocuments({ gym: gymId, expiryDate: { $gte: today } }),
            Member.countDocuments({ gym: gymId, expiryDate: { $lt: today } }),
            Member.countDocuments({ gym: gymId, expiryDate: { $gte: today, $lte: fiveDaysFromNow } }),
            Member.countDocuments({ gym: gymId, expiryDate: { $gte: today, $lte: tomorrow } }),
            Member.countDocuments({ 
                gym: gymId, 
                $expr: { $lt: [{ $ifNull: ['$paidFee', 0] }, { $ifNull: ['$totalFee', 0] }] } 
            })
        ]);

        res.json({
            total,
            active,
            expired,
            expiringSoon,
            expiring1Day,
            amountPending
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addMember,
    getMembers,
    updateMember,
    addPayment,
    deleteMember,
    renewMember,
    getMembersByGymId,
    getUpcomingBirthdays,
    getDashboardStats
};