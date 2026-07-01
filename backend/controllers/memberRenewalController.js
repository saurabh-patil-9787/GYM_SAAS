const Member = require('../models/Member');
const Plan = require('../models/Plan');
const RenewalRequest = require('../models/RenewalRequest');
const Notification = require('../models/Notification');
const Gym = require('../models/Gym');
const { createNotification } = require('../services/notificationService');

// =============================
// MEMBER: STANDARD RENEWAL (Continue Plan)
// =============================
// @desc    Initiate standard Continue Plan renewal (extends from current expiry)
// @route   POST /api/member/renewal/standard
// @access  Private (Member)
const standardRenewal = async (req, res, next) => {
    const { planId } = req.body;

    if (!planId) {
        return res.status(400).json({ message: 'Plan selection is required' });
    }

    try {
        const member = await Member.findById(req.member._id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Verify plan exists and is active for this gym
        const plan = await Plan.findOne({
            _id: planId,
            gym: member.gym,
            status: 'Active'
        });

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found or inactive' });
        }

        // Calculate new expiry: Current Expiry + Plan Duration
        const currentExpiry = new Date(member.expiryDate);
        const baseDate = currentExpiry;
        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + plan.duration);

        // Update member
        member.planDuration = plan.duration;
        member.expiryDate = newExpiry;
        member.totalFee = (Number(member.totalFee) || 0) + plan.price;
        member.status = 'Active';

        // Note: Payment is tracked separately via Razorpay or offline
        // For now, this just sets up the renewal. Payment will be handled
        // by the payment flow (online or offline by owner)

        await member.save();

        // Notify owner (in-app + FCM push)
        const gym = await Gym.findById(member.gym).select('owner').lean();
        if (gym) {
            await createNotification({
                recipientId: gym.owner,
                recipientType: 'GymOwner',
                gymId: member.gym,
                title: 'Member Renewed ✅',
                message: `${member.name} renewed with ${plan.planName} (${plan.duration} month${plan.duration > 1 ? 's' : ''})`,
                type: 'online_payment_received',
                referenceId: member._id,
                referenceModel: 'Member'
            });
        }

        // Also notify the member of successful renewal (in-app + FCM push)
        await createNotification({
            recipientId: member._id,
            recipientType: 'Member',
            gymId: member.gym,
            title: 'Membership Renewed! 🎉',
            message: `Your membership has been renewed with ${plan.planName}. New expiry: ${newExpiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
            type: 'renewal_approved',
            referenceId: member._id,
            referenceModel: 'Member'
        });

        res.json({
            message: 'Membership renewed successfully',
            newExpiryDate: newExpiry,
            planName: plan.planName,
            planDuration: plan.duration,
            planPrice: plan.price
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// MEMBER: FRESH START REQUEST
// =============================
// @desc    Submit Fresh Start request (requires owner approval)
// @route   POST /api/member/renewal/fresh-start-request
// @access  Private (Member)
const freshStartRequest = async (req, res, next) => {
    const { planId } = req.body;

    if (!planId) {
        return res.status(400).json({ message: 'Plan selection is required' });
    }

    try {
        const member = await Member.findById(req.member._id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Check for existing pending request
        const existingRequest = await RenewalRequest.findOne({
            member: member._id,
            gym: member.gym,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending renewal request' });
        }

        // Verify plan
        const plan = await Plan.findOne({
            _id: planId,
            gym: member.gym,
            status: 'Active'
        });

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found or inactive' });
        }

        // Create renewal request
        const request = await RenewalRequest.create({
            member: member._id,
            gym: member.gym,
            plan: plan._id,
            requestType: 'fresh_start',
            planName: plan.planName,
            planDuration: plan.duration,
            planPrice: plan.price
        });

        // Notify owner (in-app + FCM push)
        const gym = await Gym.findById(member.gym).select('owner').lean();
        if (gym) {
            await createNotification({
                recipientId: gym.owner,
                recipientType: 'GymOwner',
                gymId: member.gym,
                title: 'Fresh Start Request 🔄',
                message: `${member.name} requested a Fresh Start with ${plan.planName}`,
                type: 'fresh_start_request',
                referenceId: request._id,
                referenceModel: 'Member'
            });
        }

        res.status(201).json({
            message: 'Fresh Start request submitted. Waiting for gym owner approval.',
            requestId: request._id,
            status: 'pending'
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// MEMBER: CHECK RENEWAL REQUEST STATUS
// =============================
// @route   GET /api/member/renewal/status
// @access  Private (Member)
const getRenewalStatus = async (req, res, next) => {
    try {
        const request = await RenewalRequest.findOne({
            member: req.member._id,
            gym: req.member.gym,
            status: 'pending'
        })
        .select('requestType status planName planDuration planPrice createdAt')
        .lean();

        res.json({
            hasPendingRequest: !!request,
            request: request || null
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// MEMBER: GET TRANSACTION HISTORY
// =============================
// @route   GET /api/member/transactions
// @access  Private (Member)
const getMemberTransactions = async (req, res, next) => {
    try {
        const member = await Member.findById(req.member._id)
            .select('paymentHistory totalFee paidFee')
            .lean();

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Sort by date descending (newest first)
        const transactions = (member.paymentHistory || [])
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            transactions,
            totalFee: member.totalFee,
            paidFee: member.paidFee,
            outstandingDue: Math.max((Number(member.totalFee) || 0) - (Number(member.paidFee) || 0), 0)
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: GET RENEWAL REQUESTS (Pending)
// =============================
// @route   GET /api/owner/renewal-requests
// @access  Private (Owner)
const getOwnerRenewalRequests = async (req, res, next) => {
    try {
        const requests = await RenewalRequest.find({
            gym: req.gymOwner.gym,
            status: 'pending'
        })
        .populate('member', 'name mobile memberId photoUrl')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(2000);

        res.json(requests);
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: APPROVE FRESH START
// =============================
// @route   PUT /api/owner/renewal-requests/:id/approve
// @access  Private (Owner)
const approveRenewalRequest = async (req, res, next) => {
    try {
        const request = await RenewalRequest.findOne({
            _id: req.params.id,
            gym: req.gymOwner.gym,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ message: 'Renewal request not found or already processed' });
        }

        const member = await Member.findById(request.member);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Accept form data from owner; fall back to request's stored plan if not provided
        const planDuration = Number(req.body.planDuration || request.planDuration);
        const planName = req.body.planName || request.planName;
        const totalFee = Number(req.body.totalFee ?? request.planPrice ?? 0);
        const paidFee = Number(req.body.paidFee ?? 0);
        const paymentMethod = req.body.paymentMethod || 'Cash';
        const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();

        // Compute new expiry: startDate + planDuration months
        const newExpiry = new Date(startDate);
        newExpiry.setMonth(newExpiry.getMonth() + planDuration);

        // Update member
        member.planDuration = planDuration;
        member.planName = planName;
        member.expiryDate = newExpiry;
        member.joiningDate = startDate; // Fresh start resets joining date
        member.totalFee = (Number(member.totalFee) || 0) + totalFee;
        member.status = 'Active';

        // Record payment in history (crucial for revenue tracking)
        if (paidFee > 0) {
            member.paidFee = (Number(member.paidFee) || 0) + paidFee;
        }
        member.paymentHistory.push({
            amount: paidFee,
            date: new Date(),
            type: paymentMethod,
            remark: 'Fresh Start approved',
            transactionType: 'renewal',
            plan: planName || (planDuration + ' Month(s)'),
            remainingDue: Math.max(((Number(member.totalFee) || 0)) - ((Number(member.paidFee) || 0)), 0)
        });

        await member.save();

        // Update request status
        request.status = 'approved';
        request.processedAt = new Date();
        request.processedBy = req.gymOwner._id;
        await request.save();

        // Notify member (in-app + FCM push)
        await createNotification({
            recipientId: member._id,
            recipientType: 'Member',
            gymId: member.gym,
            title: 'Membership Renewed! 🎉',
            message: `Your Fresh Start request for ${planName} has been approved! New expiry: ${newExpiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
            type: 'renewal_approved',
            referenceId: request._id
        });

        // Return same shape as renewMember for the frontend success modal
        res.json({
            message: 'Fresh Start approved successfully',
            memberName: member.name,
            plan: planDuration,
            planName,
            paidFee,
            dueAmount: Math.max((Number(member.totalFee) || 0) - (Number(member.paidFee) || 0), 0),
            expiryDate: newExpiry
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: REJECT FRESH START
// =============================
// @route   PUT /api/owner/renewal-requests/:id/reject
// @access  Private (Owner)
const rejectRenewalRequest = async (req, res, next) => {
    const { reason } = req.body;

    try {
        const request = await RenewalRequest.findOne({
            _id: req.params.id,
            gym: req.gymOwner.gym,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ message: 'Renewal request not found or already processed' });
        }

        request.status = 'rejected';
        request.processedAt = new Date();
        request.processedBy = req.gymOwner._id;
        request.rejectionReason = reason || '';
        await request.save();

        // Notify member (in-app + FCM push)
        const member = await Member.findById(request.member).select('name gym').lean();
        if (member) {
            await createNotification({
                recipientId: member._id,
                recipientType: 'Member',
                gymId: member.gym,
                title: 'Fresh Start Request Rejected',
                message: reason
                    ? `Your Fresh Start request was not approved. Reason: ${reason}`
                    : 'Your Fresh Start request was not approved. Please contact the gym for more information.',
                type: 'fresh_start_rejected',
                referenceId: request._id
            });
        }

        res.json({ message: 'Renewal request rejected' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    standardRenewal,
    freshStartRequest,
    getRenewalStatus,
    getMemberTransactions,
    getOwnerRenewalRequests,
    approveRenewalRequest,
    rejectRenewalRequest
};
