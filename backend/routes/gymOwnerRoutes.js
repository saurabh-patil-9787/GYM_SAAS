const express = require('express');
const router = express.Router();
const { updateEmail } = require('../controllers/gymOwnerController');
const { protect, requireActivePlan } = require('../middleware/authMiddleware');
const { validateRequest, updateEmailValidator } = require('../middleware/validationMiddleware');

router.put('/update-email', protect, requireActivePlan, updateEmailValidator, validateRequest, updateEmail);

module.exports = router;
