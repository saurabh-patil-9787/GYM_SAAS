const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
    registerGymOwner,
    loginGymOwner,
    loginAdmin,
    forgotPassword,
    resetPassword,
    refreshToken,
    logout,
    getMe,
    forgotPasswordAdmin,
    resetPasswordAdmin,
    resetAdminDirect
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const {
    validateRequest,
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    adminLoginValidator // AUDIT FIX 9: added for admin login validation
} = require('../middleware/validationMiddleware');

// Specific Rate Limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 forgot password requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many reset requests, please try again after an hour' }
});

// AUDIT FIX 5: authLimiter added to register \u2014 prevents bot/spam account creation (was unprotected)
router.post('/register', authLimiter, registerValidator, validateRequest, registerGymOwner);
router.post('/login', authLimiter, loginValidator, validateRequest, loginGymOwner);
// AUDIT FIX 9: Apply adminLoginValidator before loginAdmin controller
router.post('/admin/login', authLimiter, adminLoginValidator, validateRequest, loginAdmin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// Secure token-based reset flow
router.post('/forgotpassword', forgotPasswordLimiter, forgotPasswordValidator, validateRequest, forgotPassword);
router.put('/resetpassword/:resetToken', resetPasswordValidator, validateRequest, resetPassword);

// Admin secure token-based reset flow
router.post('/admin/forgotpassword', forgotPasswordLimiter, forgotPasswordAdmin);
router.put('/admin/resetpassword/:resetToken', resetPasswordAdmin);

// Admin Direct reset via secure recovery key
router.post('/admin/reset-direct', forgotPasswordLimiter, resetAdminDirect);

module.exports = router;
