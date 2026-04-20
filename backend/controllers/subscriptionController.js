const Razorpay = require('razorpay');
const crypto = require('crypto');
const Gym = require('../models/Gym');
// AUDIT FIX 11: Bust plan cache immediately after successful subscription renewal
const { invalidatePlanCache } = require('../middleware/authMiddleware');

// @desc    Create Razorpay Order
// @route   POST /api/subscription/create-order
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { planType } = req.body;
        let amount = 0; // Amount in paise

        if (planType === 'Monthly') {
            amount = 24900; // ₹249
        } else if (planType === 'Yearly') {
            amount = 240000; // ₹2400
        } else {
            return res.status(400).json({ message: 'Invalid plan type' });
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amount,
            currency: "INR",
            receipt: `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2,5)}`
        };

        const order = await instance.orders.create(options);
        res.json({
            success: true,
            order,
            amount,
            planType,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error creating order:', error);
        const errorMsg = error.error?.description || error.message || 'Error creating order';
        res.status(500).json({ message: errorMsg });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/subscription/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planType
        } = req.body;

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update Gym Status
            const gym = await Gym.findOne({ owner: req.user._id });
            if (!gym) {
                return res.status(404).json({ message: 'Gym not found' });
            }

            const today = new Date();
            let startDate = new Date();
            let currentExpiry = gym.expiryDate ? new Date(gym.expiryDate) : today;

            // Start from the existing expiry date to maintain continuous billing cycles
            startDate = currentExpiry;

            const planDuration = planType === 'Yearly' ? 365 : 30;
            const newExpiry = new Date(startDate);
            newExpiry.setDate(newExpiry.getDate() + planDuration);

            gym.planStatus = 'ACTIVE';
            gym.planType = planType || 'Monthly';
            gym.planStartDate = startDate;
            gym.expiryDate = newExpiry;
            gym.paymentId = razorpay_payment_id;

            await gym.save();
            // AUDIT FIX 11: Clear stale plan cache so renewed plan takes effect immediately
            invalidatePlanCache(req.user._id);

            res.json({
                success: true,
                message: "Payment verified successfully",
                newExpiry: gym.expiryDate
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: "Server error verifying payment" });
    }
};

// AUDIT FIX 2: testExpireGym disabled — was a test-only endpoint accessible to any authenticated user in production
// exports.testExpireGym = async (req, res) => { ... };
