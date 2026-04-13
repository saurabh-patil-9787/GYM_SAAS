const express = require('express');
const router = express.Router();
const { getRevenueStats } = require('../controllers/analyticsController');
const { protect, requireActivePlan } = require('../middleware/authMiddleware');

router.get('/revenue', protect, requireActivePlan, getRevenueStats);

module.exports = router;
