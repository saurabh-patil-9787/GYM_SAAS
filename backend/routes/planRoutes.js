const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createPlan, getPlans, updatePlan, deletePlan } = require('../controllers/planController');
const { protect, requireActivePlan } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

// All owner routes require authentication + active subscription
router.use(protect, requireActivePlan);

// GET all plans for owner's gym
router.get('/', getPlans);

// CREATE a new plan
router.post('/', [
    body('planName').notEmpty().withMessage('Plan name is required').trim(),
    body('duration').notEmpty().withMessage('Duration is required').isIn([1, 3, 6, 12]).withMessage('Duration must be 1, 3, 6, or 12 months'),
    body('price').notEmpty().withMessage('Price is required').isNumeric().custom(v => Number(v) >= 0).withMessage('Price must be >= 0')
], validateRequest, createPlan);

// UPDATE a plan
router.put('/:id', [
    body('planName').optional().trim().notEmpty().withMessage('Plan name cannot be empty'),
    body('duration').optional().isIn([1, 3, 6, 12]).withMessage('Duration must be 1, 3, 6, or 12 months'),
    body('price').optional().isNumeric().custom(v => Number(v) >= 0).withMessage('Price must be >= 0'),
    body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive')
], validateRequest, updatePlan);

// SOFT DELETE (deactivate) a plan
router.delete('/:id', deletePlan);

module.exports = router;
