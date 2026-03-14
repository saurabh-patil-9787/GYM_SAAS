const express = require('express');
const router = express.Router();
const { updateEmail } = require('../controllers/gymOwnerController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest, updateEmailValidator } = require('../middleware/validationMiddleware');

router.put('/update-email', protect, updateEmailValidator, validateRequest, updateEmail);

module.exports = router;
