const express = require('express');
const router = express.Router();
const { addMember, getMembers, updateMember, addPayment, deleteMember, renewMember, getMembersByGymId } = require('../controllers/memberController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, addMember);
router.get('/', protect, getMembers);
router.put('/:id', protect, updateMember);
router.put('/:id/pay', protect, addPayment);

// Delete Member
router.delete('/:id', protect, deleteMember);

// Renew Membership
router.put('/:id/renew', protect, renewMember);

// Get Members by Gym ID (Admin Only)
router.get('/gym/:gymId', protect, adminOnly, getMembersByGymId);

module.exports = router;
