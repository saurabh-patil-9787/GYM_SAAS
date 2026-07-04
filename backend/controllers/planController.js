const Plan = require('../models/Plan');

// =============================
// OWNER: CREATE PLAN
// =============================
// @route   POST /api/plans
// @access  Private (Owner)
const createPlan = async (req, res, next) => {
    const { planName, duration, price } = req.body;

    if (!planName || !duration || price === undefined || price === null) {
        return res.status(400).json({ message: 'Plan name, duration, and price are required' });
    }

    try {
        const plan = await Plan.create({
            gym: req.gymOwner.gym,
            planName: planName.trim(),
            duration: Number(duration),
            price: Number(price),
            status: 'Active'
        });

        res.status(201).json(plan);
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: GET ALL PLANS (Active + Inactive)
// =============================
// @route   GET /api/plans
// @access  Private (Owner)
const getPlans = async (req, res, next) => {
    try {
        const plans = await Plan.find({ gym: req.gymOwner.gym })
            .sort({ status: 1, createdAt: -1 }) // Active first, then by newest
            .lean()
            .maxTimeMS(2000);

        // Removed cache-control so owner sees updates (create/delete) immediately
        res.json(plans);
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: UPDATE PLAN
// =============================
// @route   PUT /api/plans/:id
// @access  Private (Owner)
const updatePlan = async (req, res, next) => {
    const { planName, duration, price, status } = req.body;

    try {
        const plan = await Plan.findOne({ _id: req.params.id, gym: req.gymOwner.gym });

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        if (planName) plan.planName = planName.trim();
        if (duration) plan.duration = Number(duration);
        if (price !== undefined && price !== null) plan.price = Number(price);
        if (status) plan.status = status;

        await plan.save();
        res.json(plan);
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: DELETE (HARD) PLAN
// =============================
// @route   DELETE /api/plans/:id
// @access  Private (Owner)
const deletePlan = async (req, res, next) => {
    try {
        const plan = await Plan.findOneAndDelete({ _id: req.params.id, gym: req.gymOwner.gym });

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// =============================
// MEMBER: GET ACTIVE PLANS FOR THEIR GYM
// =============================
// @route   GET /api/member/plans
// @access  Private (Member)
const getMemberPlans = async (req, res, next) => {
    try {
        const plans = await Plan.find({
            gym: req.member.gym,
            status: 'Active'
        })
        .sort({ price: 1 }) // Cheapest first
        .select('planName duration price')
        .lean()
        .maxTimeMS(2000);

        res.set('Cache-Control', 'private, max-age=300');
        res.json(plans);
    } catch (error) {
        next(error);
    }
};

// =============================
// PUBLIC: GET ACTIVE PLANS FOR A GYM (no auth — used on self-registration)
// =============================
// @route   GET /api/public/plans/:gymId
// @access  Public
const getGymPlansPublic = async (req, res, next) => {
    try {
        const { gymId } = req.params;
        if (!gymId) {
            return res.status(400).json({ message: 'Gym ID is required' });
        }
        const plans = await Plan.find({
            gym: gymId,
            status: 'Active'
        })
        .sort({ price: 1 })
        .select('planName duration price')
        .lean()
        .maxTimeMS(2000);

        res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        res.json(plans);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPlan,
    getPlans,
    updatePlan,
    deletePlan,
    getMemberPlans,
    getGymPlansPublic
};
