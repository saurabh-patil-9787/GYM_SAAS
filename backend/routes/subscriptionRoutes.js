const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment, testExpireGym } = require('../controllers/subscriptionController');
const { checkSubscriptionEnabled } = require('../middleware/subscriptionMiddleware');

router.post('/create-order', protect, checkSubscriptionEnabled, createOrder);
router.post('/verify-payment', protect, checkSubscriptionEnabled, verifyPayment);
router.post('/test-expire', protect, testExpireGym);

module.exports = router;
