const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    createMemberOrder,
    verifyMemberPayment,
    razorpayWebhook
} = require('../controllers/paymentController');
const { protectMember } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

// Member-authenticated payment routes
router.post('/create-order', protectMember, [
    body('planId').notEmpty().withMessage('Plan ID is required')
], validateRequest, createMemberOrder);

router.post('/verify', protectMember, [
    body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Signature is required'),
    body('planId').notEmpty().withMessage('Plan ID is required')
], validateRequest, verifyMemberPayment);

// Webhook — no auth (verified via HMAC signature in controller)
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

module.exports = router;
