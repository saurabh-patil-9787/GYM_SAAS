const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
// AUDIT FIX 2: testExpireGym removed from import — endpoint disabled in production
const { createOrder, verifyPayment } = require('../controllers/subscriptionController');
const { checkSubscriptionEnabled } = require('../middleware/subscriptionMiddleware');
// AUDIT FIX 17: Import validators for subscription routes
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validationMiddleware');

// AUDIT FIX 17: Validate planType before createOrder controller — 'Monthly' and 'Yearly' are the exact values used by frontend and controller
router.post('/create-order', protect, checkSubscriptionEnabled, [
    body('planType')
        .notEmpty().withMessage('Plan type is required')
        .isIn(['Monthly', 'Yearly']).withMessage('planType must be one of: Monthly, Yearly')
], validateRequest, createOrder);
router.post('/verify-payment', protect, checkSubscriptionEnabled, verifyPayment);
// AUDIT FIX 2: test-expire endpoint removed — was accessible to any authenticated gym owner

module.exports = router;
