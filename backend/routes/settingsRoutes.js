const express = require('express');
const router = express.Router();
const { getSettings, updateSubscriptionStatus } = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public GET config
router.get('/', getSettings);

// Admin-only PUT
router.put('/subscription', protect, adminOnly, updateSubscriptionStatus);

module.exports = router;
