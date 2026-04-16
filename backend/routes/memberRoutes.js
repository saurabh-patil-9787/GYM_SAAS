const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { addMember, getMembers, updateMember, addPayment, deleteMember, renewMember, getMembersByGymId, getUpcomingBirthdays, getDashboardStats, getMemberHistory, checkDuplicate } = require('../controllers/memberController');
const { protect, adminOnly, requireActivePlan } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { validateRequest, memberValidator, updateMemberValidator } = require('../middleware/validationMiddleware');

const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 requests per `window`
    message: "Too many search requests from this IP, please try again after a minute"
});

router.get('/check-duplicate', protect, requireActivePlan, checkDuplicate);
router.get('/upcoming-birthdays', protect, requireActivePlan, getUpcomingBirthdays);
router.get('/dashboard-stats', protect, requireActivePlan, getDashboardStats);

router.post('/', protect, requireActivePlan, upload.single('photo'), memberValidator, validateRequest, addMember);
// Rate limit added to protect against excessive querying/searching
router.get('/', protect, requireActivePlan, searchLimiter, getMembers);
router.put('/:id', protect, requireActivePlan, upload.single('photo'), updateMemberValidator, validateRequest, updateMember);
router.put('/:id/pay', protect, requireActivePlan, addPayment);
router.get('/:id/history', protect, requireActivePlan, getMemberHistory);

// Delete Member
router.delete('/:id', protect, requireActivePlan, deleteMember);

// Renew Membership
router.put('/:id/renew', protect, requireActivePlan, renewMember);

// Get Members by Gym ID (Admin Only)
router.get('/gym/:gymId', protect, adminOnly, getMembersByGymId);

module.exports = router;
