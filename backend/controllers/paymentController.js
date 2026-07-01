const Razorpay = require('razorpay');
const crypto = require('crypto');
const Gym = require('../models/Gym');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Notification = require('../models/Notification');
const { encrypt, decrypt } = require('../utils/encryption');
const { createNotification } = require('../services/notificationService');

// =============================
// OWNER: SAVE RAZORPAY CONFIG
// =============================
// @desc    Save/update Razorpay credentials for the gym
// @route   PUT /api/gym/razorpay-config
// @access  Private (Owner)
const saveRazorpayConfig = async (req, res, next) => {
    const { razorpayKeyId, razorpayKeySecret, onlinePaymentsEnabled } = req.body;

    try {
        const gym = await Gym.findOne({ owner: req.gymOwner._id });
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        if (razorpayKeyId !== undefined) {
            gym.razorpayKeyId = razorpayKeyId.trim();
        }

        if (razorpayKeySecret !== undefined) {
            // Encrypt the secret before storing
            gym.razorpayKeySecret = encrypt(razorpayKeySecret.trim());
        }

        if (onlinePaymentsEnabled !== undefined) {
            gym.onlinePaymentsEnabled = Boolean(onlinePaymentsEnabled);
        }

        await gym.save();

        res.json({
            message: 'Razorpay configuration saved successfully',
            razorpayKeyId: gym.razorpayKeyId,
            onlinePaymentsEnabled: gym.onlinePaymentsEnabled,
            hasSecret: !!gym.razorpayKeySecret
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: GET RAZORPAY CONFIG
// =============================
// @desc    Get Razorpay config (secret is NEVER returned)
// @route   GET /api/gym/razorpay-config
// @access  Private (Owner)
const getRazorpayConfig = async (req, res, next) => {
    try {
        const gym = await Gym.findOne({ owner: req.gymOwner._id })
            .select('razorpayKeyId onlinePaymentsEnabled razorpayKeySecret')
            .lean();

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.json({
            razorpayKeyId: gym.razorpayKeyId || '',
            onlinePaymentsEnabled: gym.onlinePaymentsEnabled || false,
            hasSecret: !!gym.razorpayKeySecret
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// MEMBER: CREATE RAZORPAY ORDER
// =============================
// @desc    Create Razorpay order for a plan (uses gym owner's credentials)
// @route   POST /api/payments/create-order
// @access  Private (Member)
const createMemberOrder = async (req, res, next) => {
    const { planId } = req.body;

    if (!planId) {
        return res.status(400).json({ message: 'Plan ID is required' });
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

        // Get gym's Razorpay credentials
        const gym = await Gym.findById(member.gym);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        if (!gym.onlinePaymentsEnabled) {
            return res.status(400).json({ message: 'Online payments are not enabled for this gym' });
        }

        if (!gym.razorpayKeyId || !gym.razorpayKeySecret) {
            return res.status(400).json({ message: 'Gym has not configured payment credentials yet' });
        }

        // Decrypt the secret
        const decryptedSecret = decrypt(gym.razorpayKeySecret);

        // Create Razorpay instance with GYM OWNER's credentials
        const razorpayInstance = new Razorpay({
            key_id: gym.razorpayKeyId,
            key_secret: decryptedSecret
        });

        const amountInPaise = Math.round(plan.price * 100);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `mbr_${member._id.toString().slice(-6)}_${Date.now().toString(36)}`,
            notes: {
                memberId: member._id.toString(),
                memberName: member.name,
                gymId: gym._id.toString(),
                planId: plan._id.toString(),
                planName: plan.planName,
                planDuration: plan.duration.toString()
            }
        };

        const order = await razorpayInstance.orders.create(options);

        res.json({
            success: true,
            order,
            key_id: gym.razorpayKeyId, // Public key only — safe to send
            amount: amountInPaise,
            planName: plan.planName,
            planDuration: plan.duration,
            planPrice: plan.price,
            gymName: gym.gymName,
            memberName: member.name,
            memberMobile: member.mobile
        });
    } catch (error) {
        console.error('[Payment] Order creation failed:', error.message);
        const errorMsg = error.error?.description || error.message || 'Failed to create payment order';
        res.status(500).json({ message: errorMsg });
    }
};

// =============================
// MEMBER: VERIFY PAYMENT (Client-side callback)
// =============================
// @desc    Verify Razorpay payment after checkout completion
// @route   POST /api/payments/verify
// @access  Private (Member)
const verifyMemberPayment = async (req, res, next) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        planId,
        renewalType // 'standard', 'fresh_start', 'rejoin'
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
        return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    try {
        const member = await Member.findById(req.member._id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Get gym's Razorpay credentials for verification
        const gym = await Gym.findById(member.gym);
        if (!gym || !gym.razorpayKeySecret) {
            return res.status(400).json({ message: 'Unable to verify payment — gym config missing' });
        }

        // Decrypt secret for HMAC verification
        const decryptedSecret = decrypt(gym.razorpayKeySecret);

        // Verify HMAC-SHA256 signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', decryptedSecret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Signature verified — process the renewal
        const plan = await Plan.findOne({
            _id: planId,
            gym: member.gym,
            status: 'Active'
        });

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Calculate new expiry based on renewal type
        let newExpiry;
        if (renewalType === 'rejoin' || renewalType === 'fresh_start') {
            // Fresh start from today
            newExpiry = new Date();
            newExpiry.setMonth(newExpiry.getMonth() + plan.duration);
            member.joiningDate = new Date();
        } else {
            // Standard renewal: extend from current expiry
            const currentExpiry = new Date(member.expiryDate);
            const baseDate = currentExpiry;
            newExpiry = new Date(baseDate);
            newExpiry.setMonth(newExpiry.getMonth() + plan.duration);
        }

        // Update member
        member.planDuration = plan.duration;
        member.expiryDate = newExpiry;
        member.totalFee = (Number(member.totalFee) || 0) + plan.price;
        member.paidFee = (Number(member.paidFee) || 0) + plan.price;
        member.status = 'Active';

        // Add payment record
        member.paymentHistory.push({
            amount: plan.price,
            type: 'Online',
            date: new Date(),
            transactionType: renewalType === 'rejoin' ? 'registration' : 'renewal',
            plan: `${plan.planName} (${plan.duration} month${plan.duration > 1 ? 's' : ''})`,
            remark: `Razorpay: ${razorpay_payment_id}`,
            remainingDue: 0
        });

        await member.save();

        // Notify member (in-app + FCM push)
        await createNotification({
            recipientId: member._id,
            recipientType: 'Member',
            gymId: member.gym,
            title: 'Payment Successful! ✅',
            message: `Your payment of ₹${plan.price} for ${plan.planName} was successful. Membership active until ${newExpiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
            type: 'payment_recorded',
            referenceId: member._id,
            referenceModel: 'Member'
        });

        // Notify owner (in-app + FCM push)
        await createNotification({
            recipientId: gym.owner,
            recipientType: 'GymOwner',
            gymId: member.gym,
            title: 'Online Payment Received 💰',
            message: `${member.name} paid ₹${plan.price} online for ${plan.planName} (${plan.duration} month${plan.duration > 1 ? 's' : ''}).`,
            type: 'online_payment_received',
            referenceId: member._id,
            referenceModel: 'Member'
        });

        res.json({
            success: true,
            message: 'Payment verified and membership updated successfully',
            newExpiryDate: newExpiry,
            planName: plan.planName,
            planDuration: plan.duration,
            amountPaid: plan.price
        });
    } catch (error) {
        console.error('[Payment] Verification failed:', error.message);
        next(error);
    }
};

// =============================
// WEBHOOK: RAZORPAY PAYMENT WEBHOOK
// =============================
// @desc    Receive Razorpay webhook for payment events (backup verification)
// @route   POST /api/payments/webhook
// @access  Public (verified via HMAC-SHA256 signature)
const razorpayWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // If webhook secret is not configured, log and acknowledge safely (no processing)
        if (!webhookSecret) {
            console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET not set — webhook received but not verified. Configure this in .env for full security.');
            return res.json({ status: 'ok' });
        }

        const webhookSignature = req.headers['x-razorpay-signature'];
        if (!webhookSignature) {
            console.warn('[Webhook] Received request without x-razorpay-signature header — rejected.');
            return res.status(400).json({ status: 'missing signature' });
        }

        // Verify HMAC-SHA256 signature using raw body
        const rawBody = req.body; // express.raw() middleware provides Buffer
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        if (expectedSignature !== webhookSignature) {
            console.warn('[Webhook] Invalid signature — possible spoofed webhook rejected.');
            return res.status(400).json({ status: 'invalid signature' });
        }

        // Signature verified — safe to parse and process
        const event = JSON.parse(rawBody.toString());
        console.log('[Webhook] Verified Razorpay event received:', event?.event);

        // Payment events are primarily handled via client-side verifyMemberPayment
        // This webhook serves as a backup/audit trail
        // Future: Add event-specific processing here (e.g., payment.failed)

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('[Webhook] Error:', error.message);
        res.status(500).json({ status: 'error' });
    }
};

module.exports = {
    saveRazorpayConfig,
    getRazorpayConfig,
    createMemberOrder,
    verifyMemberPayment,
    razorpayWebhook
};
