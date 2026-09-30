const express = require('express');
const router = express.Router();
const { createStaff, getStaff, updateStaff, deleteStaff } = require('../controllers/staffController');
const { protect, ownerOnly, requireActivePlan } = require('../middleware/authMiddleware');

// All routes: authenticated owner + active subscription
router.get('/', protect, ownerOnly, requireActivePlan, getStaff);
router.post('/', protect, ownerOnly, requireActivePlan, createStaff);
router.put('/:id', protect, ownerOnly, requireActivePlan, updateStaff);
router.delete('/:id', protect, ownerOnly, requireActivePlan, deleteStaff);

module.exports = router;
