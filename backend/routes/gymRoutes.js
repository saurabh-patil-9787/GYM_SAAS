const express = require('express');
const router = express.Router();
const { createGym, getMyGym, updateGym, getAllGyms, toggleGymStatus, renewGym, deleteGym } = require('../controllers/gymController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/', protect, createGym); // Owner registers gym
router.get('/me', protect, getMyGym);
router.put('/me', protect, upload.single('logo'), updateGym);
router.get('/all', protect, adminOnly, getAllGyms);
router.put('/:id/toggle', protect, adminOnly, toggleGymStatus);
router.put('/renew/:id', protect, adminOnly, renewGym);
router.delete('/:id', protect, adminOnly, deleteGym);

module.exports = router;
