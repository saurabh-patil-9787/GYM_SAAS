const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator'); // AUDIT FIX 8: needed for inline route validators
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
// AUDIT FIX 8: Validate amount and type before addPayment controller is reached
router.put('/:id/pay', protect, requireActivePlan, [
    body('amount').notEmpty().withMessage('Amount is required').isNumeric().withMessage('Amount must be a number').custom(v => Number(v) > 0).withMessage('Amount must be greater than 0'),
    body('type').optional().isString().trim().notEmpty().withMessage('Type must be a non-empty string if provided')
], validateRequest, addPayment);
router.get('/:id/history', protect, requireActivePlan, getMemberHistory);

// Delete Member
router.delete('/:id', protect, requireActivePlan, deleteMember);

// Renew Membership
// AUDIT FIX 8: Validate renewal fields before renewMember controller is reached
router.put('/:id/renew', protect, requireActivePlan, [
    body('planDuration').notEmpty().withMessage('Plan duration required').isNumeric().custom(v => Number(v) > 0).withMessage('Duration must be positive'),
    body('totalFee').notEmpty().withMessage('Total fee required').isNumeric().custom(v => Number(v) >= 0).withMessage('Total fee must be >= 0'),
    body('paidFee').notEmpty().withMessage('Paid fee required').isNumeric().custom(v => Number(v) >= 0).withMessage('Paid fee must be >= 0')
], validateRequest, renewMember);

// Get Members by Gym ID (Admin Only)
router.get('/gym/:gymId', protect, adminOnly, getMembersByGymId);

module.exports = router;
