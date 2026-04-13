const express = require('express');
const router = express.Router();
const { addMember, getMembers, updateMember, addPayment, deleteMember, renewMember, getMembersByGymId, getUpcomingBirthdays, getDashboardStats } = require('../controllers/memberController');
const { protect, adminOnly, requireActivePlan } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { validateRequest, memberValidator, updateMemberValidator } = require('../middleware/validationMiddleware');

router.get('/upcoming-birthdays', protect, requireActivePlan, getUpcomingBirthdays);
router.get('/dashboard-stats', protect, requireActivePlan, getDashboardStats);

router.post('/', protect, requireActivePlan, upload.single('photo'), memberValidator, validateRequest, addMember);
router.get('/', protect, requireActivePlan, getMembers);
router.put('/:id', protect, requireActivePlan, upload.single('photo'), updateMemberValidator, validateRequest, updateMember);
router.put('/:id/pay', protect, requireActivePlan, addPayment);

// Delete Member
router.delete('/:id', protect, requireActivePlan, deleteMember);

// Renew Membership
router.put('/:id/renew', protect, requireActivePlan, renewMember);

// Get Members by Gym ID (Admin Only)
router.get('/gym/:gymId', protect, adminOnly, getMembersByGymId);

module.exports = router;
