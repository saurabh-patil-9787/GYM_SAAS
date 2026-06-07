const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const {
    searchGyms,
    loginMember,
    setupMemberPassword,
    registerMember,
    getMemberProfile,
    checkMemberExists,
    updateMemberProfile,
    stopGym,
    rejoinGym
} = require('../controllers/memberAuthController');

const { getMemberPlans, getGymPlansPublic } = require('../controllers/planController');

const {
    standardRenewal,
    freshStartRequest,
    getRenewalStatus,
    getMemberTransactions
} = require('../controllers/memberRenewalController');

const { reapplyMember } = require('../controllers/pendingMemberController');

const {
    getMemberNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount
} = require('../controllers/notificationController');

const { protectMember } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
    savePR,
    getPRs,
    logProgress,
    getProgressLogs,
    checkInToday,
    getCheckIns,
    getBadges,
    unlockWaterWarrior,
    updateFitnessGoals
} = require('../controllers/memberFitnessController');

// Rate Limiters
const memberAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts, please try again after 15 minutes' }
});

const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many search requests, please slow down' }
});

// ========================
// Reusable validator chains
// ========================
const memberRegisterValidator = [
    body('name').notEmpty().withMessage('Name is required').trim().isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('mobile').notEmpty().withMessage('Mobile number is required').matches(/^[0-9]{10}$/).withMessage('Mobile number must be exactly 10 digits'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('gymId').notEmpty().withMessage('Gym selection is required').isMongoId().withMessage('Invalid gym ID'),
];

const setupPasswordValidator = [
    body('mobile').notEmpty().withMessage('Mobile number is required').matches(/^[0-9]{10}$/).withMessage('Mobile number must be exactly 10 digits'),
    body('gymId').notEmpty().withMessage('Gym selection is required').isMongoId().withMessage('Invalid gym ID'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

const checkMemberValidator = [
    body('mobile').notEmpty().withMessage('Mobile number is required').matches(/^[0-9]{10}$/).withMessage('Mobile number must be exactly 10 digits'),
    body('gymId').notEmpty().withMessage('Gym ID is required').isMongoId().withMessage('Invalid gym ID'),
];

// ========================
// Public Routes
// ========================
router.get('/gyms/search', searchLimiter, searchGyms);
router.post('/member/auth/login', memberAuthLimiter, loginMember);
router.post('/member/auth/setup-password', memberAuthLimiter, setupPasswordValidator, validateRequest, setupMemberPassword);
router.post('/member/auth/register', memberAuthLimiter, memberRegisterValidator, validateRequest, registerMember);
router.post('/member/auth/check', memberAuthLimiter, checkMemberValidator, validateRequest, checkMemberExists);
// Public: fetch gym plans (for self-registration plan selection — no auth needed)
router.get('/public/plans/:gymId', getGymPlansPublic);

// ========================
// Protected Routes (Member JWT)
// ========================
// Profile
router.get('/member/profile', protectMember, getMemberProfile);
router.put('/member/profile', protectMember, upload.single('photo'), updateMemberProfile);

// Reapply after rejection — requires mobile + gymId in body for identity verification
// (rejected members cannot login, so full protectMember cannot be used)
router.put('/member/auth/reapply/:id', memberAuthLimiter, reapplyMember);

// Plans
router.get('/member/plans', protectMember, getMemberPlans);

// Renewals
router.post('/member/renewal/standard', protectMember, standardRenewal);
router.post('/member/renewal/fresh-start-request', protectMember, freshStartRequest);
router.get('/member/renewal/status', protectMember, getRenewalStatus);

// Transactions
router.get('/member/transactions', protectMember, getMemberTransactions);

// Notifications
router.get('/member/notifications', protectMember, getMemberNotifications);
router.get('/member/notifications/unread-count', protectMember, getUnreadCount);
router.put('/member/notifications/read-all', protectMember, markAllNotificationsRead);
router.put('/member/notifications/:id/read', protectMember, markNotificationRead);

// Stop Gym & Rejoin
router.post('/member/stop-gym', protectMember, stopGym);
router.post('/member/rejoin', protectMember, rejoinGym);

// FCM Token Registration
router.post('/member/fcm-token', protectMember, async (req, res) => {
    const { token, oldToken, device } = req.body;
    if (!token) return res.status(400).json({ message: 'FCM token is required' });
    
    try {
        const Member = require('../models/Member');
        const member = await Member.findById(req.member._id);
        if (!member) return res.status(404).json({ message: 'Member not found' });
        
        // Remove existing entry for this token and oldToken (prevent duplicates and refresh overlaps)
        member.fcmTokens = (member.fcmTokens || []).filter(t => t.token !== token && (!oldToken || t.token !== oldToken));
        
        // Add the new token
        member.fcmTokens.push({ token, device: device || 'web', lastUsed: new Date() });
        
        // Keep max 5 tokens per member
        if (member.fcmTokens.length > 5) {
            member.fcmTokens = member.fcmTokens.slice(-5);
        }
        
        await member.save();
        res.json({ message: 'FCM token registered' });
    } catch (error) {
        console.error('FCM token registration failed:', error);
        res.status(500).json({ message: 'Failed to register token' });
    }
});

// Notification Preferences
router.put('/member/notification-preferences', protectMember, async (req, res) => {
    const { renewalReminders, paymentAlerts, gymAnnouncements } = req.body;
    
    try {
        const Member = require('../models/Member');
        const member = await Member.findById(req.member._id);
        if (!member) return res.status(404).json({ message: 'Member not found' });
        
        if (!member.notificationPreferences) {
            member.notificationPreferences = {};
        }
        if (renewalReminders !== undefined) member.notificationPreferences.renewalReminders = renewalReminders;
        if (paymentAlerts !== undefined) member.notificationPreferences.paymentAlerts = paymentAlerts;
        if (gymAnnouncements !== undefined) member.notificationPreferences.gymAnnouncements = gymAnnouncements;
        
        await member.save();
        res.json({ message: 'Preferences updated', preferences: member.notificationPreferences });
    } catch (error) {
        console.error('Notification preferences update failed:', error);
        res.status(500).json({ message: 'Failed to update preferences' });
    }
});

// ========================
// Fitness & Gamification Routes
// ========================
router.post('/member/prs', protectMember, savePR);
router.get('/member/prs', protectMember, getPRs);
router.post('/member/progress', protectMember, logProgress);
router.get('/member/progress', protectMember, getProgressLogs);
router.post('/member/checkin', protectMember, checkInToday);
router.get('/member/checkins', protectMember, getCheckIns);
router.get('/member/badges', protectMember, getBadges);
router.post('/member/badges/water-warrior', protectMember, unlockWaterWarrior);
router.put('/member/fitness-goals', protectMember, updateFitnessGoals);

module.exports = router;
