const Member = require('../models/Member');
const Gym = require('../models/Gym');
const Notification = require('../models/Notification');
const { createNotification } = require('../services/notificationService');

// @desc    Get all pending member registrations for a gym
// @route   GET /api/members/pending
// @access  Private (Owner)
const getPendingMembers = async (req, res, next) => {
    try {
        const gymId = req.gymOwner.gym;

        const pendingMembers = await Member.find({
            gym: gymId,
            registrationStatus: 'awaiting_approval'
        })
        .select('name mobile memberId age weight height city dob registeredVia createdAt requestedPlanId')
        .populate('requestedPlanId', 'planName duration price')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(2000);

        res.json(pendingMembers);
    } catch (error) {
        next(error);
    }
};

// @desc    Get pending member count for dashboard badge
// @route   GET /api/members/pending/count
// @access  Private (Owner)
const getPendingCount = async (req, res, next) => {
    try {
        const count = await Member.countDocuments({
            gym: req.gymOwner.gym,
            registrationStatus: 'awaiting_approval'
        });

        res.json({ count });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve a pending member registration
// @route   PUT /api/members/pending/:id/approve
// @access  Private (Owner)
const approveMember = async (req, res, next) => {
    const { planDuration, planName, totalFee, paidFee, joiningDate, expiryDate, paymentMethod } = req.body;

    if (!planDuration || totalFee === undefined || totalFee === null) {
        return res.status(400).json({ message: 'Plan duration and total fee are required for approval' });
    }

    try {
        const member = await Member.findOne({
            _id: req.params.id,
            gym: req.gymOwner.gym,
            registrationStatus: 'awaiting_approval'
        });

        if (!member) {
            return res.status(404).json({ message: 'Pending member not found or already processed' });
        }

        // Set plan details
        const joinDateObj = new Date(joiningDate || Date.now());
        let expiryDateObj;
        if (expiryDate) {
            expiryDateObj = new Date(expiryDate);
        } else {
            expiryDateObj = new Date(joinDateObj);
            expiryDateObj.setMonth(expiryDateObj.getMonth() + Number(planDuration));
        }

        member.planDuration = Number(planDuration);
        if (planName) member.planName = planName;
        member.joiningDate = joinDateObj;
        member.expiryDate = expiryDateObj;
        member.totalFee = Number(totalFee);
        member.paidFee = Number(paidFee) || 0;
        member.registrationStatus = 'approved';
        member.status = 'Active';

        // Add initial payment record if paid
        if (paidFee && Number(paidFee) > 0) {
            member.paymentHistory.push({
                amount: Number(paidFee),
                date: new Date(),
                type: paymentMethod || 'Cash',
                transactionType: 'registration',
                plan: planName || (planDuration + ' Month(s)'),
                remainingDue: Math.max((Number(totalFee) || 0) - (Number(paidFee) || 0), 0)
            });
        }

        await member.save();

        // Notify member of approval (in-app + FCM push)
        await createNotification({
            recipientId: member._id,
            recipientType: 'Member',
            gymId: member.gym,
            title: 'Registration Approved! 🎉',
            message: `Welcome to the gym! Your registration has been approved. You can now access all member features.`,
            type: 'registration_approved',
            referenceId: member._id,
            referenceModel: 'Member'
        });

        res.json({
            message: 'Member approved successfully',
            member: {
                _id: member._id,
                name: member.name,
                mobile: member.mobile,
                memberId: member.memberId,
                registrationStatus: member.registrationStatus,
                planDuration: member.planDuration,
                planName: member.planName,
                expiryDate: member.expiryDate,
                totalFee: member.totalFee,
                paidFee: member.paidFee
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reapply after rejection
// @route   PUT /api/members/pending/:id/reapply  (now also /api/member/auth/reapply/:id)
// @access  Semi-public — requires mobile + gymId verification (rejected members cannot login)
const reapplyMember = async (req, res, next) => {
    const { mobile, gymId } = req.body;

    // Identity verification: caller must provide their mobile and gymId
    if (!mobile || !gymId) {
        return res.status(400).json({ message: 'Mobile number and gym selection are required to reapply.' });
    }

    try {
        const member = await Member.findOne({
            _id: req.params.id,
            registrationStatus: 'rejected',
            mobile: mobile.trim(),
            gym: gymId
        });

        if (!member) {
            return res.status(404).json({ message: 'No rejected registration found for this ID. Please verify your mobile number and gym.' });
        }

        // Reset to awaiting approval
        member.registrationStatus = 'awaiting_approval';
        member.status = 'Active'; // will stay inactive until approved
        
        // Update details if passed in the body safely
        if (req.body) {
            const allowedFields = ['name', 'age', 'weight', 'height', 'city', 'dob'];
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    if (field === 'dob') {
                        member.dob = req.body.dob ? new Date(req.body.dob) : null;
                    } else {
                        member[field] = req.body[field];
                    }
                }
            });
            if (req.body.planId) {
                member.requestedPlanId = req.body.planId || null;
            }
        }
        await member.save();

        // Notify gym owner
        const Gym = require('../models/Gym');
        const gym = await Gym.findById(member.gym).select('owner').lean();
        if (gym) {
            await createNotification({
                recipientId: gym.owner,
                recipientType: 'GymOwner',
                gymId: member.gym,
                title: 'Member Re-applied 🔄',
                message: `${member.name} has reapplied for membership after rejection.`,
                type: 'new_registration_request',
                referenceId: member._id,
                referenceModel: 'Member'
            });
        }

        res.json({
            message: 'Reapplication submitted successfully. Waiting for gym owner approval.',
            registrationStatus: 'awaiting_approval'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject a pending member registration
// @route   PUT /api/members/pending/:id/reject
// @access  Private (Owner)
const rejectMember = async (req, res, next) => {
    try {
        const member = await Member.findOne({
            _id: req.params.id,
            gym: req.gymOwner.gym,
            registrationStatus: 'awaiting_approval'
        });

        if (!member) {
            return res.status(404).json({ message: 'Pending member not found or already processed' });
        }

        member.registrationStatus = 'rejected';
        member.status = 'Inactive';
        await member.save();

        // Notify member of rejection (in-app + FCM push)
        await createNotification({
            recipientId: member._id,
            recipientType: 'Member',
            gymId: member.gym,
            title: 'Registration Not Approved',
            message: 'Your registration request was not approved. Please contact the gym for more information.',
            type: 'registration_rejected',
            referenceId: member._id,
            referenceModel: 'Member'
        });

        res.json({ message: 'Member registration rejected' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPendingMembers,
    getPendingCount,
    approveMember,
    rejectMember,
    reapplyMember
};
