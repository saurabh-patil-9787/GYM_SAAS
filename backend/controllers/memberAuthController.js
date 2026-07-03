const Member = require('../models/Member');
const Gym = require('../models/Gym');
const RefreshToken = require('../models/RefreshToken');
const Notification = require('../models/Notification');
const Plan = require('../models/Plan');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const { createNotification } = require('../services/notificationService');

// Helper to generate Refresh Token for a member
const generateMemberRefreshToken = (member, ipAddress) => {
    return new RefreshToken({
        user: member._id,
        userType: 'Member',
        token: crypto.randomBytes(40).toString('hex'),
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdByIp: ipAddress
    });
};

const setTokenCookie = (res, token) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    res.cookie('refreshToken', token, cookieOptions);
};

// @desc    Search gyms by name (unauthenticated)
// @route   GET /api/gyms/search?q={query}
// @access  Public
const searchGyms = async (req, res, next) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    try {
        // Escape special regex characters to prevent ReDoS attacks
        const safeQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const gyms = await Gym.find({
            gymName: { $regex: safeQ, $options: 'i' },
            isActive: true
        })
        .select('gymName city pincode logoUrl contactNumber')
        .limit(20)
        .lean();

        res.json(gyms);
    } catch (error) {
        next(error);
    }
};

// @desc    Member Login (mobile + password, gym-scoped)
// @route   POST /api/member/auth/login
// @access  Public
const loginMember = async (req, res, next) => {
    const { mobile, password, gymId } = req.body;

    if (!mobile || !password || !gymId) {
        return res.status(400).json({ message: 'Mobile, password, and gym selection are required' });
    }

    try {
        const member = await Member.findOne({ mobile: mobile.trim(), gym: gymId });

        if (!member) {
            return res.status(401).json({ message: 'No member found with this mobile number at the selected gym' });
        }

        // Check if member has a password set
        if (!member.password) {
            return res.status(401).json({ 
                message: 'Your account was created by the gym owner. Please set a password first.',
                requiresPasswordSetup: true,
                memberId: member._id
            });
        }

        const isMatch = await member.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Check registration approval status
        if (member.registrationStatus === 'awaiting_approval') {
            return res.status(403).json({ 
                message: 'Your registration is pending approval from the gym owner',
                status: 'awaiting_approval'
            });
        }

        if (member.registrationStatus === 'rejected') {
            return res.status(403).json({ 
                message: 'Your registration was rejected. Please contact the gym.',
                status: 'rejected'
            });
        }

        // Generate tokens
        const accessToken = generateToken(member._id, { memberId: member.memberId, gymId: member.gym, role: 'member' });
        const refreshToken = generateMemberRefreshToken(member, req.ip);
        await refreshToken.save();

        setTokenCookie(res, refreshToken.token);

        // Get gym info
        const gym = await Gym.findById(gymId).select('gymName city pincode logoUrl').lean();

        // ── Award daily login XP (non-blocking, never affects login flow) ──
        const { awardXP } = require('../services/xpEngineService');
        awardXP(member._id, gymId, 'login', 'Daily Login').catch(err =>
            console.error('[Login] XP award failed (non-critical):', err.message)
        );

        res.json({
            _id: member._id,
            name: member.name,
            mobile: member.mobile,
            memberId: member.memberId,
            role: 'member',
            gymId: gymId,
            gymName: gym?.gymName,
            gymLogoUrl: gym?.logoUrl,
            status: member.status,
            registrationStatus: member.registrationStatus,
            photoUrl: member.photoUrl,
            planDuration: member.planDuration,
            joiningDate: member.joiningDate,
            expiryDate: member.expiryDate,
            token: accessToken
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Setup password for owner-added member (first-time login)
// @route   POST /api/member/auth/setup-password
// @access  Public
const setupMemberPassword = async (req, res, next) => {
    const { mobile, gymId, password } = req.body;

    if (!mobile || !gymId || !password) {
        return res.status(400).json({ message: 'Mobile, gym, and password are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    try {
        const member = await Member.findOne({ mobile: mobile.trim(), gym: gymId });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        if (member.password) {
            return res.status(400).json({ message: 'Password already set. Use login instead.' });
        }

        member.password = password;
        await member.save();

        res.json({ message: 'Password set successfully. You can now login.' });
    } catch (error) {
        next(error);
    }
};

// @desc    Self-register new member (requires gym owner approval)
// @route   POST /api/member/auth/register
// @access  Public
const registerMember = async (req, res, next) => {
    const { name, mobile, password, gymId, age, weight, height, city, dob, planId } = req.body;

    if (!name || !mobile || !password || !gymId) {
        return res.status(400).json({ message: 'Name, mobile, password, and gym are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    try {
        // Check if gym exists and is active
        const gym = await Gym.findById(gymId);
        if (!gym || !gym.isActive) {
            return res.status(404).json({ message: 'Gym not found or inactive' });
        }

        // Check if member already exists at this gym
        const existingMember = await Member.findOne({ mobile: mobile.trim(), gym: gymId });
        if (existingMember) {
            if (existingMember.registrationStatus === 'awaiting_approval') {
                return res.status(400).json({ message: 'A registration request is already pending for this number' });
            }
            return res.status(400).json({ message: 'A member with this mobile number already exists at this gym' });
        }

        // Generate next memberId
        const memberIdNum = gym.nextMemberId || 1;
        const memberId = `M${String(memberIdNum).padStart(4, '0')}`;

        // Create pending member (awaiting owner approval)
        const member = await Member.create({
            gym: gymId,
            memberId,
            name: name.trim(),
            mobile: mobile.trim(),
            password,
            age: age || undefined,
            weight: weight || undefined,
            height: height || undefined,
            city: city || undefined,
            dob: dob || undefined,
            requestedPlanId: planId || undefined, // Store selected plan for owner's approval form
            registrationStatus: 'awaiting_approval',
            registeredVia: 'self',
            // Defaults for required fields — will be set properly on approval
            planDuration: 1,
            joiningDate: new Date(),
            expiryDate: new Date(), // Will be updated on approval
            totalFee: 0,
            paidFee: 0,
            status: 'Active'
        });

        // Increment nextMemberId
        gym.nextMemberId = memberIdNum + 1;
        await gym.save();

        // Notify gym owner (in-app + FCM push)
        await createNotification({
            recipientId: gym.owner,
            recipientType: 'GymOwner',
            gymId: gym._id,
            title: 'New Member Registration 🆕',
            message: `${name.trim()} has registered and is waiting for your approval.`,
            type: 'new_registration_request',
            referenceId: member._id,
            referenceModel: 'Member'
        });

        res.status(201).json({
            message: 'Registration submitted successfully. Waiting for gym owner approval.',
            memberId: member.memberId,
            registrationStatus: 'awaiting_approval'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get member profile (authenticated)
// @route   GET /api/member/profile
// @access  Private (Member)
const getMemberProfile = async (req, res, next) => {
    try {
        const member = await Member.findById(req.member._id)
            .select('-password')
            .populate('gym', 'gymName city pincode logoUrl onlinePaymentsEnabled contactNumber');

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json(member);
    } catch (error) {
        next(error);
    }
};

// @desc    Update member profile (text fields + optional photo upload)
// @route   PUT /api/member/profile
// @access  Private (Member)
const updateMemberProfile = async (req, res, next) => {
    try {
        // Removed: console.log of req.body — was logging sensitive profile data in production
        const member = await Member.findById(req.member._id);

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Handle photo removal
        if (req.body.removePhoto === 'true' && member.photoPublicId) {
            const cloudinary = require('../utils/cloudinary');
            try { await cloudinary.uploader.destroy(member.photoPublicId); } catch (e) { /* ignore */ }
            member.photoUrl = null;
            member.photoPublicId = null;
        }

        // Handle new photo upload (via multer/cloudinary middleware)
        if (req.file) {
            const cloudinary = require('../utils/cloudinary');
            // Delete old photo
            if (member.photoPublicId) {
                try { await cloudinary.uploader.destroy(member.photoPublicId); } catch (e) { /* ignore */ }
            }
            member.photoUrl = req.file.path || req.file.secure_url || req.file.url;
            member.photoPublicId = req.file.filename;
        }

        const allowedFields = [
            'name', 'age', 'weight', 'height', 'city', 'dob',
            'gender', 'activityLevel', 'fitnessGoal', 'goalWeight', 'targetDate', 'preferredWorkoutTime', 'notificationPreferences'
        ];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'dob') {
                    member.dob = req.body.dob ? new Date(req.body.dob) : null;
                } else if (field === 'targetDate') {
                    member.targetDate = req.body.targetDate ? new Date(req.body.targetDate) : null;
                } else if (field === 'notificationPreferences') {
                    try {
                        const prefs = typeof req.body.notificationPreferences === 'string'
                            ? JSON.parse(req.body.notificationPreferences)
                            : req.body.notificationPreferences;
                        if (prefs && typeof prefs === 'object') {
                            member.notificationPreferences = {
                                ...member.notificationPreferences,
                                ...prefs
                            };
                        }
                    } catch (parseErr) {
                        return res.status(400).json({ message: 'Invalid notification preferences format' });
                    }
                } else {
                    member[field] = req.body[field];
                }
            }
        });

        await member.save();

        res.json({
            message: 'Profile updated successfully',
            member: {
                name: member.name,
                age: member.age,
                weight: member.weight,
                height: member.height,
                city: member.city,
                dob: member.dob,
                photoUrl: member.photoUrl,
                gender: member.gender,
                activityLevel: member.activityLevel,
                fitnessGoal: member.fitnessGoal,
                goalWeight: member.goalWeight,
                targetDate: member.targetDate,
                preferredWorkoutTime: member.preferredWorkoutTime,
                notificationPreferences: member.notificationPreferences
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Check member existence at a gym (for password setup flow)
// @route   POST /api/member/auth/check
// @access  Public
const checkMemberExists = async (req, res, next) => {
    const { mobile, gymId } = req.body;

    if (!mobile || !gymId) {
        return res.status(400).json({ message: 'Mobile and gymId are required' });
    }

    try {
        const member = await Member.findOne({ mobile: mobile.trim(), gym: gymId })
            .select('name mobile memberId photoUrl password registrationStatus requestedPlanId');

        if (!member) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            _id: member._id,
            hasPassword: !!member.password,
            name: member.name,
            memberId: member.memberId,
            photoUrl: member.photoUrl,
            registrationStatus: member.registrationStatus,
            requestedPlanId: member.requestedPlanId
            // Health fields (age, weight, height, city, dob) are intentionally
            // excluded from this unauthenticated endpoint to protect member privacy
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Stop Gym (soft deactivation — member side)
// @route   POST /api/member/stop-gym
// @access  Private (Member)
const stopGym = async (req, res, next) => {
    try {
        const member = await Member.findById(req.member._id);

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        member.status = 'Inactive';
        
        // AUDIT FIX: Disable notifications when member stops gym
        if (!member.notificationPreferences) member.notificationPreferences = {};
        member.notificationPreferences.renewalReminders = false;
        member.notificationPreferences.paymentAlerts = false;
        member.notificationPreferences.gymAnnouncements = false;

        await member.save();

        // Notify owner (in-app + FCM push)
        const gym = await Gym.findById(member.gym).select('owner').lean();
        if (gym) {
            await createNotification({
                recipientId: gym.owner,
                recipientType: 'GymOwner',
                gymId: member.gym,
                title: 'Member Stopped Gym',
                message: `${member.name} (${member.memberId}) has chosen to stop their gym membership.`,
                type: 'member_stopped',
                referenceId: member._id,
                referenceModel: 'Member'
            });
        }

        res.json({ message: 'Gym membership paused. You can rejoin anytime.' });
    } catch (error) {
        next(error);
    }
};

// @desc    Rejoin gym (reactivation from stopped state)
// @route   POST /api/member/rejoin
// @access  Private (Member)
const rejoinGym = async (req, res, next) => {
    const { planId } = req.body;

    if (!planId) {
        return res.status(400).json({ message: 'Plan selection is required' });
    }

    try {
        const member = await Member.findById(req.member._id);

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        if (member.status !== 'Inactive') {
            return res.status(400).json({ message: 'Only stopped members can rejoin' });
        }

        // Verify plan
        const plan = await Plan.findOne({
            _id: planId,
            gym: member.gym,
            status: 'Active'
        });

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found or inactive' });
        }

        // Reactivate with fresh start
        const newExpiry = new Date();
        newExpiry.setMonth(newExpiry.getMonth() + plan.duration);

        member.status = 'Active';
        member.planDuration = plan.duration;
        member.joiningDate = new Date();
        member.expiryDate = newExpiry;
        member.totalFee = (Number(member.totalFee) || 0) + plan.price;

        await member.save();

        // Notify owner (in-app + FCM push)
        const gym = await Gym.findById(member.gym).select('owner').lean();
        if (gym) {
            await createNotification({
                recipientId: gym.owner,
                recipientType: 'GymOwner',
                gymId: member.gym,
                title: 'Member Rejoined! 🎉',
                message: `${member.name} (${member.memberId}) has rejoined with ${plan.planName}.`,
                type: 'member_rejoined',
                referenceId: member._id,
                referenceModel: 'Member'
            });
        }

        res.json({
            message: 'Welcome back! Your membership is now active.',
            newExpiryDate: newExpiry,
            planName: plan.planName
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    searchGyms,
    loginMember,
    setupMemberPassword,
    registerMember,
    getMemberProfile,
    updateMemberProfile,
    checkMemberExists,
    stopGym,
    rejoinGym
};
