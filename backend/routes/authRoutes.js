const express = require('express');
const router = express.Router();
const { registerGymOwner, loginGymOwner, loginAdmin, forgotPassword, resetPassword, resetPasswordDirect, refreshToken, logout, getMe, forgotPasswordAdmin, resetPasswordAdmin, resetAdminAnyDirect } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerGymOwner);
router.post('/login', loginGymOwner);
router.post('/admin/login', loginAdmin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);
router.post('/reset-password-direct', resetPasswordDirect);
router.post('/admin/forgotpassword', forgotPasswordAdmin);
router.put('/admin/resetpassword/:resetToken', resetPasswordAdmin);
router.post('/admin/reset-direct', resetAdminAnyDirect);

module.exports = router;
