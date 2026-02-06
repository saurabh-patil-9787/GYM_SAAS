const express = require('express');
const router = express.Router();
const { createGym, getAllGyms, toggleGymStatus, renewGym } = require('../controllers/gymController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, createGym); // Owner registers gym
router.get('/all', protect, adminOnly, getAllGyms);
router.put('/:id/toggle', protect, adminOnly, toggleGymStatus);
router.put('/renew/:id', protect, adminOnly, renewGym);

module.exports = router;
