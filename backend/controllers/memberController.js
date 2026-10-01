const Member = require('../models/Member');
const Gym = require('../models/Gym');
const Notification = require('../models/Notification');
const imageStorageService = require('../utils/imageStorageService');
const { normalizeMobile } = require('../utils/phoneUtils');
const { createNotification } = require('../services/notificationService');
const { sendToOwner, sendToMember } = require('../utils/sseManager');
const bcrypt = require('bcryptjs');
const MemberPasswordResetRequest = require('../models/MemberPasswordResetRequest');
const { invalidateRevenueCache } = require('./analyticsController');

const paymentCollector = (user) => ({
    collectedBy: user?.role === 'staff' ? (user.ownerName || 'Support Staff') : 'Gym Owner',
    collectedByRole: user?.role === 'staff' ? 'staff' : 'owner'
});

// =============================
// ADD NEW MEMBER
// =============================
const addMember = async (req, res, next) => {
    try {
        const { name, mobile, age, weight, height, city, planDuration, planName, totalFee, paidFee, joiningDate, dob, allowDuplicateMobile } = req.body || {};
        
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
                console.log(`[Duplicate Overridden] Gym: ${req.gymOwner.gym}`);
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

        let photoData = { url: null, key: null, provider: 'cloudinary' };
        if (req.file) {
            const uploaded = await imageStorageService.uploadImage(req.file.buffer, req.file.mimetype, 'members', gym._id.toString());
            photoData = { url: uploaded.url, key: uploaded.key, provider: uploaded.provider };
        }

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
            photoUrl: photoData.url,
            photoPublicId: photoData.key,
            photoProvider: photoData.provider,
            planDuration,
            planName: planName || null,
            joiningDate: joinDateObj,
            expiryDate: expiryDateObj,
            totalFee: Number(totalFee),
            paidFee: Number(paidFee) || 0,
            paymentHistory: paidFee > 0 ? [{
                amount: Number(paidFee),
                date: new Date(),
                type: req.body.paymentMethod || 'Cash',
                transactionType: 'registration',
                plan: planName || (planDuration + ' Month(s)'),
                remainingDue: Math.max((Number(totalFee) || 0) - (Number(paidFee) || 0), 0),
                nextExpiryDate: expiryDateObj,
                planDuration: Number(planDuration),
                ...paymentCollector(req.user)
            }] : [],
            status: 'Active'
        });

        res.status(201).json(member);

        // ── SSE P2: notify owner dashboard that a new member was added ──
        // Fire after responding so the HTTP reply is never delayed.
        try {
            const gym = await Gym.findById(member.gym).select('owner').lean();
            if (gym?.owner) {
                sendToOwner(String(gym.owner), 'member_added', {
                    memberId: member.memberId,
                    name: member.name
                });
            }
        } catch { /* SSE failure is non-critical */ }
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
        else if (status === 'expiring_today') {
            const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
            query.expiryDate = { $gte: startOfToday, $lte: endOfToday };
        }
        else if (status === 'expiring_1to5' || status === 'expiring_6to10' || status === 'expiring_11to15') {
            const ranges = { expiring_1to5: [1, 5], expiring_6to10: [6, 10], expiring_11to15: [11, 15] };
            const [from, to] = ranges[status];
            query.expiryDate = { $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate() + from), $lte: new Date(today.getFullYear(), today.getMonth(), today.getDate() + to, 23, 59, 59, 999) };
        }
        else if (status === 'expired_1to5' || status === 'expired_6to10' || status === 'expired_11to15') {
            const ranges = { expired_1to5: [1, 5], expired_6to10: [6, 10], expired_11to15: [11, 15] };
            const [from, to] = ranges[status];
            query.expiryDate = {
                $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate() - to),
                $lte: new Date(today.getFullYear(), today.getMonth(), today.getDate() - from, 23, 59, 59, 999)
            };
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
                .select('name mobile memberId status photoUrl planDuration planName expiryDate totalFee paidFee joiningDate age weight height city dob') // Added planName
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
        let oldPhotoInfo = null;

        if (req.body.removePhoto === 'true' && member.photoPublicId) {
            oldPhotoInfo = { id: member.photoPublicId, provider: member.photoProvider || 'cloudinary' };
            member.photoUrl = null;
            member.photoPublicId = null;
            member.photoProvider = 'cloudinary';
        }

        // Handle New Photo Upload
        if (req.file) {
            const uploadedImage = await imageStorageService.uploadImage(req.file.buffer, req.file.mimetype, 'members', req.gymOwner.gym.toString());
            
            if (member.photoPublicId && !oldPhotoInfo) {
                oldPhotoInfo = { id: member.photoPublicId, provider: member.photoProvider || 'cloudinary' };
            }

            member.photoUrl = uploadedImage.url;
            member.photoPublicId = uploadedImage.key;
            member.photoProvider = uploadedImage.provider;
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

        if (oldPhotoInfo) {
            await imageStorageService.deleteImage(oldPhotoInfo.id, oldPhotoInfo.provider);
        }

        res.json(member);

        // ── SSE P2: notify owner dashboard that a member profile was updated ──
        try {
            const gym = await Gym.findById(member.gym).select('owner').lean();
            if (gym?.owner) {
                sendToOwner(String(gym.owner), 'member_updated', {
                    memberId: member.memberId,
                    name: member.name
                });
            }
        } catch { /* SSE failure is non-critical */ }

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
            plan: member.planName || `${member.planDuration || 1} Month(s)`,
            remainingDue: Math.max((Number(member.totalFee) || 0) - (Number(member.paidFee) || 0), 0),
            nextExpiryDate: member.expiryDate,
            planDuration: member.planDuration,
            ...paymentCollector(req.user)
        });

        await member.save();

        // Invalidate every revenue period for this gym.
        invalidateRevenueCache(member.gym);

        // Notify member of offline payment recorded (in-app + FCM push)
        try {
            await createNotification({
                recipientId: member._id,
                recipientType: 'Member',
                gymId: member.gym,
                title: 'Payment Recorded ✅',
                message: `A payment of ₹${paymentAmount} has been recorded by the gym.`,
                type: 'payment_recorded',
                referenceId: member._id,
                referenceModel: 'Member'
            });
        } catch (notifErr) {
            console.error('Failed to create payment notification:', notifErr);
        }

        // ── SSE P1: push payment_recorded to member's connected clients ──
        // This wires the previously-registered but never-fired event.
        sendToMember(String(member._id), 'payment_recorded', {
            amount: paymentAmount,
            type: type || 'Cash'
        });

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
            await imageStorageService.deleteImage(member.photoPublicId, member.photoProvider || 'cloudinary');
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
        const { planDuration, planName, totalFee, paidFee, renewalType, planStartDate } = req.body;

    try {
        const member = await Member.findOne({
            _id: req.params.id,
            gym: req.gymOwner.gym
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        let startExpiryDate;
        const previousExpiryDate = member.expiryDate;
        
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
        if (planName) member.planName = planName;
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
                plan: planName || (planDuration + ' Month(s)'),
                remainingDue: Math.max((Number(member.totalFee) || 0) - (Number(member.paidFee) || 0), 0),
                nextExpiryDate: newExpiry,
                previousExpiryDate,
                planDuration: Number(planDuration),
                ...paymentCollector(req.user)
            });
        }

        member.status = 'Active';

        await member.save();

        // Renewal changes revenue totals for all date filters.
        invalidateRevenueCache(member.gym);

        // Notify member of renewal by owner (in-app + FCM push)
        try {
            await createNotification({
                recipientId: member._id,
                recipientType: 'Member',
                gymId: member.gym,
                title: 'Membership Renewed! 🎉',
                message: `Your membership has been renewed for ${planDuration} month(s). New expiry: ${newExpiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
                type: 'renewal_approved',
                referenceId: member._id,
                referenceModel: 'Member'
            });
        } catch (notifErr) {
            console.error('Failed to create renewal notification:', notifErr);
        }

        // ── SSE P1: push renewal events to member's connected clients ──
        sendToMember(String(member._id), 'renewal_approved', {
            expiryDate: newExpiry,
            planName: planName || (planDuration + ' Month(s)')
        });
        if (paidFee && Number(paidFee) > 0) {
            sendToMember(String(member._id), 'payment_recorded', {
                amount: Number(paidFee),
                type: req.body.paymentMethod || 'Cash'
            });
        }

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

        // Pagination — defaults keep backward compatibility for existing admin UI
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 500, 500);
        const skip = (page - 1) * limit;

        const [members, total] = await Promise.all([
            Member.find({ gym: gymId })
                .sort({ memberId: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Member.countDocuments({ gym: gymId })
        ]);

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
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        const rangeEnd = (days) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + days, 23, 59, 59, 999);
        const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const day6 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6);
        const day11 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11);

        const expiredRange = (fromDaysAgo, toDaysAgo) => ({
            $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate() - toDaysAgo),
            $lte: new Date(today.getFullYear(), today.getMonth(), today.getDate() - fromDaysAgo, 23, 59, 59, 999)
        });

        const visibleMember = { gym: gymId, registrationStatus: { $ne: 'awaiting_approval' } };
        const [total, active, expired, expiringSoon, expiringToday, expiring1to5, expiring6to10, expiring11to15, amountPending, pendingApprovals, expired1to5, expired6to10, expired11to15] = await Promise.all([
            Member.countDocuments({ gym: gymId, registrationStatus: { $ne: 'awaiting_approval' } }),
            Member.countDocuments({ ...visibleMember, expiryDate: { $gte: startOfToday } }),
            Member.countDocuments({ ...visibleMember, expiryDate: { $lt: startOfToday } }),
            Member.countDocuments({ ...visibleMember, expiryDate: { $gte: startOfToday, $lte: rangeEnd(5) } }),
            Member.countDocuments({ ...visibleMember, expiryDate: { $gte: startOfToday, $lte: endOfToday } }),
            Member.countDocuments({ ...visibleMember, expiryDate: { $gte: tomorrow, $lte: rangeEnd(5) } }),
            Member.countDocuments({ ...visibleMember, expiryDate: { $gte: day6, $lte: rangeEnd(10) } }),
            Member.countDocuments({ ...visibleMember, expiryDate: { $gte: day11, $lte: rangeEnd(15) } }),
            Member.countDocuments({ 
                gym: gymId, 
                registrationStatus: { $ne: 'awaiting_approval' },
                $expr: { $lt: [{ $ifNull: ['$paidFee', 0] }, { $ifNull: ['$totalFee', 0] }] } 
            }),
            Member.countDocuments({ gym: gymId, registrationStatus: 'awaiting_approval' }),
            Member.countDocuments({ ...visibleMember, expiryDate: expiredRange(1, 5) }),
            Member.countDocuments({ ...visibleMember, expiryDate: expiredRange(6, 10) }),
            Member.countDocuments({ ...visibleMember, expiryDate: expiredRange(11, 15) })
        ]);

        res.json({
            total,
            active,
            expired,
            expiringSoon,
            expiring1Day: expiringToday,
            expiringToday,
            expiring1to5,
            expiring6to10,
            expiring11to15,
            amountPending,
            pendingApprovals,
            expired1to5,
            expired6to10,
            expired11to15
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
            { paymentHistory: 1, name: 1, mobile: 1, memberId: 1, photoUrl: 1, planName: 1, planDuration: 1, expiryDate: 1, totalFee: 1, paidFee: 1 }
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
                mobile: member.mobile,
                memberId: member.memberId,
                photoUrl: member.photoUrl,
                planName: member.planName,
                planDuration: member.planDuration,
                expiryDate: member.expiryDate,
                totalFee: member.totalFee,
                paidFee: member.paidFee,
                totalReceived: sortedHistory.reduce((total, payment) => total + (Number(payment.amount) || 0), 0),
                history: sortedHistory
            }
        });
    } catch (error) {
        next(error);
    }
};

// Search by name, phone, or member ID and return the complete payment ledger.
// Limited to ten members so the mobile PWA remains responsive on broad name searches.
const searchMemberTransactionHistory = async (req, res, next) => {
    try {
        const search = String(req.query.search || '').trim();
        if (search.length < 2) return res.status(400).json({ message: 'Enter at least 2 characters to search.' });

        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const mobileSearch = normalizeMobile(search) || search.replace(/\D/g, '');
        const members = await Member.find({
            gym: req.gymOwner.gym,
            $or: [
                { name: { $regex: safeSearch, $options: 'i' } },
                { mobile: { $regex: `^${mobileSearch}` } },
                { memberId: search }
            ]
        })
            .select('name mobile memberId photoUrl planName planDuration expiryDate totalFee paidFee paymentHistory')
            .sort({ name: 1 })
            .limit(10)
            .lean()
            .maxTimeMS(1500);

        res.json({
            data: members.map(member => ({
                ...member,
                totalReceived: (member.paymentHistory || []).reduce((total, payment) => total + (Number(payment.amount) || 0), 0),
                paymentHistory: (member.paymentHistory || []).sort((a, b) => new Date(b.date) - new Date(a.date))
            }))
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

// =============================
// GET PASSWORD RESET REQUESTS
// =============================
const getPasswordResetRequests = async (req, res, next) => {
    try {
        const requests = await MemberPasswordResetRequest.find({ gym: req.gymOwner.gym })
            .populate('member', 'name mobile photoUrl memberId')
            .sort({ requestedAt: -1 });

        res.json(requests);
    } catch (error) {
        next(error);
    }
};

// =============================
// APPROVE PASSWORD RESET REQUEST
// =============================
const approvePasswordReset = async (req, res, next) => {
    try {
        const request = await MemberPasswordResetRequest.findOne({ 
            _id: req.params.id, 
            gym: req.gymOwner.gym,
            status: 'PENDING'
        }).populate('member', 'fcmTokens');

        if (!request) {
            return res.status(404).json({ message: 'Pending request not found' });
        }

        // Generate GYM#####
        const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
        const plaintextPassword = `GYM${randomDigits}`;

        // Hash and store
        const salt = await bcrypt.genSalt(10);
        request.temporaryPasswordHash = await bcrypt.hash(plaintextPassword, salt);
        
        // 24 hours expiry
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        request.temporaryPasswordExpiresAt = expiresAt;

        request.status = 'APPROVED';
        request.approvedAt = new Date();
        request.approvedBy = req.gymOwner.id; // Corrected to use ID
        
        await request.save();

        // Notify member (if FCM token exists)
        try {
            await createNotification({
                recipientId: request.member._id,
                recipientType: 'Member',
                gymId: req.gymOwner.gym,
                title: 'Password Reset Approved',
                message: 'Your password reset request has been approved. Please collect your temporary password from the gym owner.',
                type: 'password_reset_approved',
                referenceModel: 'MemberPasswordResetRequest'
            });
        } catch (notifErr) {
            console.error('Failed to notify member of password reset approval:', notifErr);
        }

        res.json({
            message: 'Request approved successfully',
            temporaryPassword: plaintextPassword // Sent ONCE
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// REJECT PASSWORD RESET REQUEST
// =============================
const rejectPasswordReset = async (req, res, next) => {
    try {
        const request = await MemberPasswordResetRequest.findOne({ 
            _id: req.params.id, 
            gym: req.gymOwner.gym,
            status: 'PENDING'
        });

        if (!request) {
            return res.status(404).json({ message: 'Pending request not found' });
        }

        request.status = 'REJECTED';
        request.rejectedAt = new Date();
        request.rejectedBy = req.gymOwner.id;
        
        await request.save();

        res.json({ message: 'Request rejected' });
    } catch (error) {
        next(error);
    }
};

// =============================
// REGENERATE PASSWORD RESET REQUEST
// =============================
const regeneratePasswordReset = async (req, res, next) => {
    try {
        const request = await MemberPasswordResetRequest.findOne({ 
            _id: req.params.id, 
            gym: req.gymOwner.gym,
            status: 'APPROVED'
        });

        if (!request) {
            return res.status(404).json({ message: 'Approved request not found' });
        }

        // Generate GYM#####
        const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
        const plaintextPassword = `GYM${randomDigits}`;

        // Hash and store
        const salt = await bcrypt.genSalt(10);
        request.temporaryPasswordHash = await bcrypt.hash(plaintextPassword, salt);
        
        // 24 hours expiry
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        request.temporaryPasswordExpiresAt = expiresAt;

        // Reset tracking
        request.failedAttempts = 0;
        request.regeneratedAt = new Date();
        request.regenerationCount += 1;
        
        await request.save();

        res.json({
            message: 'Temporary password regenerated successfully',
            temporaryPassword: plaintextPassword // Sent ONCE
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
    getDashboardStats,
    getMemberHistory,
    searchMemberTransactionHistory,
    checkDuplicate,
    getPasswordResetRequests,
    approvePasswordReset,
    rejectPasswordReset,
    regeneratePasswordReset
};
