const Member = require('../models/Member');
const Gym = require('../models/Gym');


// =============================
// ADD NEW MEMBER
// =============================
const addMember = async (req, res) => {
    const { name, mobile, age, weight, height, city, planDuration, totalFee, paidFee, joiningDate } = req.body;

    try {
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
        res.status(500).json({ message: error.message });
    }
};


// =============================
// GET MEMBERS (WITH FILTERS)
// =============================
const getMembers = async (req, res) => {
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
        else if (status === 'due') {
            query.$or = [
                { expiryDate: { $lt: today } },
                { $expr: { $lt: ['$paidFee', '$totalFee'] } }
            ];
        }

        // Search by name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const members = await Member.find(query).sort({ memberId: -1 });

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
                ...m._doc,
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


// =============================
// ADD PAYMENT
// =============================
const addPayment = async (req, res) => {
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
const deleteMember = async (req, res) => {
    try {
        const member = await Member.findOneAndDelete({
            _id: req.params.id,
            gym: req.gymOwner.gym
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({ message: 'Member removed successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// =============================
// RENEW MEMBERSHIP
// =============================
const renewMember = async (req, res) => {
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
const getMembersByGymId = async (req, res) => {
    try {
        const { gymId } = req.params;

        const members = await Member.find({ gym: gymId }).sort({ memberId: -1 });

        const membersWithData = members.map(m => {
            const isPlanExpired = new Date(m.expiryDate) < new Date();
            const pendingAmount = Math.max(
                (Number(m.totalFee) || 0) - (Number(m.paidFee) || 0),
                0
            );

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


module.exports = {
    addMember,
    getMembers,
    updateMember,
    addPayment,
    deleteMember,
    renewMember,
    getMembersByGymId
};