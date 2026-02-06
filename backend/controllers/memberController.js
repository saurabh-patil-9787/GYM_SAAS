const Member = require('../models/Member');
const Gym = require('../models/Gym');

// @desc    Add New Member
// @route   POST /api/members
// @access  Private (Owner)
const addMember = async (req, res) => {
    const { name, mobile, age, weight, height, city, planDuration, totalFee, paidFee, joiningDate } = req.body;

    try {
        const gym = await Gym.findById(req.gymOwner.gym);
        if (!gym) {
            return res.status(400).json({ message: 'Gym not found for this owner. Please setup gym first.' });
        }

        // Calculate Expiry Date
        const joinDateObj = new Date(joiningDate || Date.now());
        let expiryDateObj;

        if (req.body.expiryDate) {
            // Manual expiry for existing members
            expiryDateObj = new Date(req.body.expiryDate);
        } else {
            // Auto-calculate for new members
            expiryDateObj = new Date(joinDateObj);
            expiryDateObj.setMonth(expiryDateObj.getMonth() + Number(planDuration));
        }

        // Create Member
        const member = await Member.create({
            gym: gym._id,
            memberId: gym.nextMemberId,
            name,
            mobile,
            age,
            weight,
            height,
            city,
            planDuration,
            joiningDate: joinDateObj,
            expiryDate: expiryDateObj,
            totalFee,
            paidFee,
            paymentHistory: [{
                amount: paidFee,
                date: Date.now(),
                type: 'Cash' // Defaulting to Cash for initial
            }],
            status: 'Active'
        });

        // Increment Gym Member ID
        gym.nextMemberId += 1;
        await gym.save();

        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Members with Filters
// @route   GET /api/members
// @access  Private (Owner)
const getMembers = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = { gym: req.gymOwner.gym };

        // Handle Status Logic
        if (status === 'active') {
            query.status = 'Active';
        } else if (status === 'expired') {
            // Logic for expired can be checking date, but we also rely on status field
            // For now, let's rely on status field which we should update periodically or on fetch
            // But simpler is:
            query.expiryDate = { $lt: new Date() };
        } else if (status === 'due') {
            // Due means Amount Pending OR Expired
            // Let's assume 'due' param means Amount Pending for this context if typically used
            // But users might check "Due List (Plan Expired)" and "Due List (Amount Pending)"
            // If status is 'pending_payment', we check paidFee < totalFee
            // If filters are distinct, we can use specific query params
        }

        // Simple search
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const members = await Member.find(query).sort({ memberId: -1 });

        // Augment with computed status if needed, though we store it.
        // Let's checking pending fee on the fly
        const membersWithData = members.map(m => {
            const isPlanExpired = new Date(m.expiryDate) < new Date();
            const pendingAmount = m.totalFee - m.paidFee;
            return {
                ...m._doc,
                isPlanExpired,
                pendingAmount
            };
        });

        res.json(membersWithData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Member details
// @route   PUT /api/members/:id
// @access  Private (Owner)
const updateMember = async (req, res) => {
    try {
        const member = await Member.findOneAndUpdate(
            { _id: req.params.id, gym: req.gymOwner.gym },
            req.body,
            { new: true }
        );
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add Payment
// @route   PUT /api/members/:id/pay
// @access  Private (Owner)
const addPayment = async (req, res) => {
    const { amount, type } = req.body;
    try {
        const member = await Member.findOne({ _id: req.params.id, gym: req.gymOwner.gym });
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        member.paidFee += Number(amount);
        member.paymentHistory.push({
            amount: Number(amount),
            type: type || 'Cash',
            date: Date.now()
        });

        // Check if fully paid?
        // Not changing status solely on payment unless it was expired and they renewed, 
        // but renewal is usually a "Renew Plan" action (Plan Update), not just paying dues.
        // Creating a "Review Plan" endpoint might be better, but for now paying pending amount is here.

        await member.save();
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteMember = async (req, res) => {
    try {
        const member = await Member.findOneAndDelete({ _id: req.params.id, gym: req.gymOwner.gym });
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json({ message: 'Member removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Renew Membership
// @route   PUT /api/members/:id/renew
// @access  Private (Owner)
const renewMember = async (req, res) => {
    const { planDuration, totalFee, paidFee } = req.body;
    try {
        const member = await Member.findOne({ _id: req.params.id, gym: req.gymOwner.gym });
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Update Plan Duration
        const currentExpiry = new Date(member.expiryDate) > new Date() ? new Date(member.expiryDate) : new Date();
        const newExpiry = new Date(currentExpiry);
        newExpiry.setMonth(newExpiry.getMonth() + Number(planDuration));

        member.planDuration = planDuration;
        member.expiryDate = newExpiry;
        member.totalFee = Number(member.totalFee) + Number(totalFee); // Cumulative fee tracking or just reset? Usually cumulative for history or period based.
        // For simplicity in this app iteration, let's treat totalFee as 'current plan fee' or 'lifetime'? 
        // Usage suggests 'Due' calculation is (total - paid). If we add to total, we must add to paid.
        // Better approach for this user request "renew member... re-select a plan":
        // Resetting vs Accumulating: If we want to track "Due", we should probably reset for the NEW duration or strictly add.
        // Let's Add to totalFee and PaidFee to keep history, OR (simpler) just update the "Current Plan" details.
        // Given the schemas shown usually:
        // Let's add the new plan cost to totalFee.
        member.totalFee = (Number(member.totalFee) || 0) + Number(totalFee);

        // Add payment
        if (paidFee > 0) {
            member.paidFee = (Number(member.paidFee) || 0) + Number(paidFee);
            member.paymentHistory.push({
                amount: Number(paidFee),
                type: 'Cash', // Default
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

// @desc    Get Members by Gym ID (Admin Only)
// @route   GET /api/members/gym/:gymId
// @access  Private (Admin)
const getMembersByGymId = async (req, res) => {
    try {
        const { gymId } = req.params;
        const members = await Member.find({ gym: gymId }).sort({ memberId: -1 });

        const membersWithData = members.map(m => {
            const isPlanExpired = new Date(m.expiryDate) < new Date();
            const pendingAmount = m.totalFee - m.paidFee;
            return {
                ...m._doc,
                isPlanExpired,
                pendingAmount
            };
        });

        res.json(membersWithData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addMember, getMembers, updateMember, addPayment, deleteMember, renewMember, getMembersByGymId };
