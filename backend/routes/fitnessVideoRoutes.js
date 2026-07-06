const express = require('express');
const router = express.Router();
const fitnessVideoController = require('../controllers/fitnessVideoController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
// Get all videos (can be filtered by category)
router.get('/', fitnessVideoController.getVideos);

// Upload a new video (Admin only)
router.post('/', protect, adminOnly, fitnessVideoController.createVideo);

// Increment video views
router.put('/:id/view', fitnessVideoController.incrementView);

// Update a video's title, description, category, or status (Admin only)
router.put('/:id', protect, adminOnly, fitnessVideoController.updateVideo);

// Delete a video (Admin only)
router.delete('/:id', protect, adminOnly, fitnessVideoController.deleteVideo);

module.exports = router;
