const express = require('express');
const router = express.Router();
const { addMember, getMembers, updateMember, addPayment, deleteMember, renewMember, getMembersByGymId, getUpcomingBirthdays, getDashboardStats } = require('../controllers/memberController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { validateRequest, memberValidator, updateMemberValidator } = require('../middleware/validationMiddleware');

router.get('/upcoming-birthdays', protect, getUpcomingBirthdays);
router.get('/dashboard-stats', protect, getDashboardStats);

router.post('/', protect, upload.single('photo'), memberValidator, validateRequest, addMember);
router.get('/', protect, getMembers);
router.put('/:id', protect, upload.single('photo'), updateMemberValidator, validateRequest, updateMember);
router.put('/:id/pay', protect, addPayment);

// Delete Member
router.delete('/:id', protect, deleteMember);

// Renew Membership
router.put('/:id/renew', protect, renewMember);

// Get Members by Gym ID (Admin Only)
router.get('/gym/:gymId', protect, adminOnly, getMembersByGymId);

module.exports = router;
