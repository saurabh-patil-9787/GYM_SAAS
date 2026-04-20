const express = require('express');
const router = express.Router();
const { createGym, getMyGym, updateGym, getAllGyms, toggleGymStatus, renewGym, deleteGym } = require('../controllers/gymController');
const { protect, adminOnly, requireActivePlan } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
// AUDIT FIX 16: Import validators for gym routes
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validationMiddleware');

// AUDIT FIX 16: Validate gym creation fields
router.post('/', protect, [
    body('gymName').trim().notEmpty().withMessage('Gym name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Gym name must be 2–100 characters'),
    body('city').trim().notEmpty().withMessage('City is required')
        .isLength({ min: 2 }).withMessage('City must be at least 2 characters'),
    body('pincode').trim().notEmpty().withMessage('Pincode is required')
        .matches(/^[0-9]{5,6}$/).withMessage('Pincode must be 5 or 6 digits')
], validateRequest, createGym); // Owner registers gym
router.get('/me', protect, getMyGym);
router.put('/me', protect, requireActivePlan, upload.single('logo'), updateGym);
router.get('/all', protect, adminOnly, getAllGyms);
router.put('/:id/toggle', protect, adminOnly, toggleGymStatus);
// AUDIT FIX 16: Validate duration before renewGym controller
router.put('/renew/:id', protect, adminOnly, [
    body('duration').notEmpty().withMessage('Duration is required')
        .isNumeric().withMessage('Duration must be a number')
        .custom(v => Number(v) >= 1).withMessage('Duration must be at least 1')
], validateRequest, renewGym);
router.delete('/:id', protect, adminOnly, deleteGym);

module.exports = router;
