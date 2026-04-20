const Member = require('../models/Member');
const Gym = require('../models/Gym');
const cloudinary = require('../utils/cloudinary');
const { normalizeMobile } = require('../utils/phoneUtils');

// =============================
// ADD NEW MEMBER
// =============================
const addMember = async (req, res, next) => {
    try {
        const { name, mobile, age, weight, height, city, planDuration, totalFee, paidFee, joiningDate, dob, allowDuplicateMobile } = req.body || {};
        
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const gym = await Gym.findOneAndUpdate(
            { _id: req.gymOwner.gym },
            { $inc: { nextMemberId: 1 } },
            { new: true } // Returns the updated document state, safely yielding our atomic incrementing ID.
        );
        if (!gym) {
            return res.status(400).json({ message: 'Gym not found. Please setup gym first.' });
        }

        const cleanMobile = normalizeMobile(mobile);
        if (cleanMobile && cleanMobile.length === 10) {
            if (String(allowDuplicateMobile) !== 'true') {
                const existingMember = await Member.findOne({ gym: req.gymOwner.gym, mobile: cleanMobile }).select('name mobile memberId status expiryDate').lean().maxTimeMS(1000);
                if (existingMember) {
                    return res.status(409).json({
                        isDuplicate: true,
                        message: 'This mobile number is already registered.',
                        existingMember: {
                            _id: existingMember._id,
                            memberId: existingMember.memberId,
                            name: existingMember.name,
                            mobile: existingMember.mobile,
                            status: new Date(existingMember.expiryDate) < new Date() ? 'Expired' : 'Active',
                            expiryDate: existingMember.expiryDate
                        }
                    });
                }
            } else {
                console.log(`[Duplicate Overridden] Gym: ${req.gymOwner.gym}, Mobile: ${cleanMobile}`);
            }
        }

        const joinDateObj = new Date(joiningDate || Date.now());

        let expiryDateObj;
        if (req.body.expiryDate) {
            expiryDateObj = new Date(req.body.expiryDate);
        } else {
            expiryDateObj = new Date(joinDateObj);
            expiryDateObj.setMonth(expiryDateObj.getMonth() + Number(planDuration));
        }

        const memberIdToAssign = String(gym.nextMemberId);

        const member = await Member.create({
            gym: gym._id,
            memberId: memberIdToAssign,
            name,
            mobile: cleanMobile || mobile,
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
                date: new Date(),
                type: req.body.paymentMethod || 'Cash',
                transactionType: 'registration',
                plan: planDuration + ' Month(s)',
                remainingDue: Math.max((Number(totalFee) || 0) - (Number(paidFee) || 0), 0)
            }] : [],
            status: 'Active'
        });

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
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        // AUDIT FIX 12: Hard cap to prevent memory spikes — 'all' becomes 500, numeric capped at 500
        let limit = req.query.limit === 'all' ? 500 : Math.min(parseInt(req.query.limit) || 30, 500);
        const skip = (page - 1) * (limit || 1);

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

        // Search by name, mobile, or member ID
        if (search && search.trim().length >= 3) {
            const cleanSearch = search.trim();
            const safeSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const cleanMobileSearch = normalizeMobile(cleanSearch) || cleanSearch;

            query.$or = [
                { mobile: cleanMobileSearch },
                { mobile: { $regex: `^${safeSearch}` } },
                { memberId: cleanSearch },
                { name: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        const [members, total] = await Promise.all([
            Member.find(query)
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .select('name mobile memberId status photoUrl planDuration expiryDate totalFee paidFee joiningDate') // Strict projection 
                .lean()
                .maxTimeMS(1000),
            Member.countDocuments(query).maxTimeMS(1000)
        ]);

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

        res.json({
            data: membersWithData,
            total,
            page,
            pages: Math.ceil(total / limit)
        });

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

    // AUDIT FIX 4: Validate amount before any DB write — prevents NaN from corrupting paidFee
    const paymentAmount = Number(amount);
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({ message: 'Valid positive payment amount is required' });
    }

    try {
        const member = await Member.findOne({
            _id: req.params.id,
            gym: req.gymOwner.gym
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        member.paidFee = (Number(member.paidFee) || 0) + paymentAmount;

        member.paymentHistory.push({
            amount: paymentAmount,
            type: type || 'Cash',
            date: new Date(),
            transactionType: 'due',
            remainingDue: Math.max((Number(member.totalFee) || 0) - (Number(member.paidFee) || 0), 0)
        });

        await member.save();

        res.json(member);

    } catch (error) {
        // AUDIT FIX 14: Route through global errorMiddleware instead of leaking error.message
        next(error);
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
    const { planDuration, totalFee, paidFee, renewalType, planStartDate } = req.body;

    try {
        const member = await Member.findOne({
            _id: req.params.id,
            gym: req.gymOwner.gym
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        let startExpiryDate;
        
        if (renewalType === 'Start Fresh') {
            startExpiryDate = planStartDate ? new Date(planStartDate) : new Date();
        } else if (renewalType === 'Continue Plan') {
            startExpiryDate = new Date(member.expiryDate);
        } else {
            // Fallback for old clients or default behavior
            startExpiryDate = new Date(member.expiryDate) > new Date()
                ? new Date(member.expiryDate)
                : new Date();
        }

        const newExpiry = new Date(startExpiryDate);
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
                type: req.body.paymentMethod || 'Cash',
                date: new Date(),
                remark: 'Renewal',
                transactionType: 'renewal',
                plan: planDuration + ' Month(s)',
                remainingDue: Math.max((Number(member.totalFee) || 0) - (Number(member.paidFee) || 0), 0)
            });
        }

        member.status = 'Active';

        await member.save();

        res.json(member);

    } catch (error) {
        // AUDIT FIX 14: Route through global errorMiddleware instead of leaking error.message
        next(error);
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
        // AUDIT FIX 14: Route through global errorMiddleware instead of leaking error.message
        next(error);
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


// =============================
// GET MEMBER HISTORY
// =============================
const getMemberHistory = async (req, res, next) => {
    try {
        const member = await Member.findOne(
            { _id: req.params.id, gym: req.gymOwner.gym },
            { paymentHistory: { $slice: -3 }, name: 1 }
        ).lean();

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        let sortedHistory = [];
        if (member.paymentHistory && member.paymentHistory.length > 0) {
            sortedHistory = member.paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        res.json({
            success: true,
            data: {
                name: member.name,
                history: sortedHistory
            }
        });
    } catch (error) {
        next(error);
    }
};


// =============================
// CHECK DUPLICATE MEMBER
// =============================
const checkDuplicate = async (req, res, next) => {
    try {
        const { mobile } = req.query;
        if (!mobile) return res.status(400).json({ message: 'Mobile is required' });

        const cleanMobile = normalizeMobile(mobile);
        if (cleanMobile.length !== 10) {
             return res.json({ isDuplicate: false });
        }

        const existingMember = await Member.findOne({ gym: req.gymOwner.gym, mobile: cleanMobile }).select('name mobile memberId status expiryDate').lean().maxTimeMS(500);
        
        if (existingMember) {
            return res.json({
                isDuplicate: true,
                message: 'This mobile number is already registered.',
                existingMember: {
                    _id: existingMember._id,
                    memberId: existingMember.memberId,
                    name: existingMember.name,
                    mobile: existingMember.mobile,
                    status: new Date(existingMember.expiryDate) < new Date() ? 'Expired' : 'Active',
                    expiryDate: existingMember.expiryDate
                }
            });
        }

        return res.json({ isDuplicate: false });
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
    getDashboardStats,
    getMemberHistory,
    checkDuplicate
};