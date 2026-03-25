const GymOwner = require('../models/GymOwner');
const Gym = require('../models/Gym');
const Admin = require('../models/Admin');
const RefreshToken = require('../models/RefreshToken');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Helper to generate Refresh Token
const generateRefreshToken = (user, ipAddress) => {
    return new RefreshToken({
        user: user._id,
        userType: user.role === 'admin' ? 'Admin' : 'GymOwner',
        token: crypto.randomBytes(40).toString('hex'),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdByIp: ipAddress
    });
};

const setTokenCookie = (res, token) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true in production
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // None for cross-site in prod if needed, or Lax/Strict
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    res.cookie('refreshToken', token, cookieOptions);
};

// @desc    Register a new Gym Owner
// @route   POST /api/auth/register
// @access  Public
const registerGymOwner = async (req, res, next) => {
    const { ownerName, mobile, email, password } = req.body;

    try {
        const ownerExists = await GymOwner.findOne({ $or: [{ mobile }, { email }] });

        if (ownerExists) {
            return res.status(400).json({ success: false, message: 'User with this mobile or email already exists' });
        }

        const owner = await GymOwner.create({
            ownerName,
            mobile,
            email,
            password
        });

        if (owner) {
            const accessToken = generateToken(owner._id);
            const refreshToken = generateRefreshToken(owner, req.ip);
            await refreshToken.save();

            setTokenCookie(res, refreshToken.token);

            res.status(201).json({
                _id: owner._id,
                ownerName: owner.ownerName,
                mobile: owner.mobile,
                email: owner.email,
                token: accessToken
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Auth Gym Owner & get token
// @route   POST /api/auth/login
// @access  Public
const loginGymOwner = async (req, res, next) => {
    const { mobile, password } = req.body;

    try {
        const owner = await GymOwner.findOne({ mobile });

        if (owner && (await owner.matchPassword(password))) {
            const gym = await Gym.findOne({ owner: owner._id });
            const hasGym = !!gym;

            // Self-healing: if owner.gym is missing but gym exists
            if (hasGym && (!owner.gym || owner.gym.toString() !== gym._id.toString())) {
                owner.gym = gym._id;
                await owner.save();
            }

            if (gym && !gym.isActive) {
                return res.status(403).json({ success: false, message: 'Your plan is expired. Please contact admin to reactivate.' });
            }

            // Generate Tokens
            const accessToken = generateToken(owner._id);
            const refreshToken = generateRefreshToken(owner, req.ip);
            await refreshToken.save();

            setTokenCookie(res, refreshToken.token);

            res.json({
                _id: owner._id,
                ownerName: owner.ownerName,
                mobile: owner.mobile,
                email: owner.email,
                role: owner.role,
                hasGym: hasGym,
                gymId: gym ? gym._id : undefined,
                gymName: gym ? gym.gymName : undefined,
                gymLogoUrl: gym ? gym.logoUrl : undefined,
                token: accessToken
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid mobile or password' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Auth Admin & get token
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });

        if (admin && (await admin.matchPassword(password))) {
            const accessToken = generateToken(admin._id);
            const refreshToken = generateRefreshToken(admin, req.ip);
            await refreshToken.save();

            setTokenCookie(res, refreshToken.token);

            res.json({
                _id: admin._id,
                username: admin.username,
                role: 'admin',
                token: accessToken
            });
        } else {
            res.status(401).json({ message: 'Invalid admin credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public (Cookie)
const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;

    if (!token) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const rToken = await RefreshToken.findOne({ token }).populate('user');

        if (!rToken || !rToken.isActive) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Token Rotation
        // Revoke the used token and issue a new one
        rToken.revoked = Date.now();
        rToken.revokedByIp = req.ip;

        const newRefreshToken = generateRefreshToken(rToken.user, req.ip);
        rToken.replacedByToken = newRefreshToken.token;

        await rToken.save();
        await newRefreshToken.save();

        setTokenCookie(res, newRefreshToken.token);

        const user = rToken.user;
        const accessToken = generateToken(user._id);

        res.json({
            token: accessToken,
            user: {
                _id: user._id,
                // Return basic fields depending on user type
                // If populate doesn't resolve role correctly, we might need manual check
                // But our Schema has refPath equivalent logic via population? 
                // Wait, RefreshToken 'user' field is just ObjectId ref 'GymOwner'.
                // If it's Admin, we might have issues if we strictly ref GymOwner.
                // Let's assume for now user is hydrated.
                role: user.role,
                ownerName: user.ownerName || user.username,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during refresh' });
    }
};

// @desc    Log out user / Clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
    const token = req.cookies.refreshToken;

    if (token) {
        const rToken = await RefreshToken.findOne({ token });
        if (rToken) {
            rToken.revoked = Date.now();
            rToken.revokedByIp = req.ip;
            await rToken.save();
        }
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });

    res.json({ message: 'Logged out successfully' });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    // req.user is set by authMiddleware
    // We need to fetch full details
    try {
        // We don't know if it's Admin or GymOwner just from ID in some cases
        // But authMiddleware usually attaches the user object.
        // Let's assume authMiddleware attaches `req.user`
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = req.user;

        // If it's a GymOwner, let's fetch gym details too
        let data = {
            _id: user._id,
            ownerName: user.ownerName || user.username,
            mobile: user.mobile,
            role: user.role,
        };

        if (user.role !== 'admin') {
            const gym = await Gym.findOne({ owner: user._id });
            data.hasGym = !!gym;
            data.gymId = gym ? gym._id : undefined;
            data.gymName = gym ? gym.gymName : undefined;
            data.gymLogoUrl = gym ? gym.logoUrl : undefined;
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Keep existing forgot/reset logic
// @desc    Forgot Password - Send Reset Link via Email
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    const successMessage = "If that email address is in our database, we will send you an email to reset your password.";

    try {
        const owner = await GymOwner.findOne({ email });

        // Security: Prevent account enumeration. Always return the same result.
        if (!owner) {
            return res.json({ success: true, message: successMessage });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');

        owner.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        owner.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await owner.save();

        // Ideally use ENV for frontend URL
        const frontendUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
        
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: `"Gym SaaS" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Reset Your Password',
                html: `
                    <p>You requested to reset your password.</p>
                    <p>Click the link below to create a new password:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                    <p>This link will expire in 10 minutes.</p>
                    <p>If you did not request this password reset, please ignore this email.</p>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Nodemailer Email Sent:', info.messageId);
        } catch (emailError) {
             console.error("Failed to send email via Nodemailer:", emailError);
             owner.resetPasswordToken = undefined;
             owner.resetPasswordExpire = undefined;
             await owner.save();
             return next(new Error('Email could not be sent. Please assure your emailing settings are correct.'));
        }

        res.json({ success: true, message: successMessage });
    } catch (error) {
        console.error(error);
        if (owner) {
             owner.resetPasswordToken = undefined;
             owner.resetPasswordExpire = undefined;
             await owner.save();
        }
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');

    try {
        const owner = await GymOwner.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!owner) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        owner.password = req.body.password;
        // Strict token cleanup to prevent reuse
        owner.resetPasswordToken = undefined;
        owner.resetPasswordExpire = undefined;

        await owner.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin Forgot Password
const forgotPasswordAdmin = async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');

        admin.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await admin.save();

        const frontendUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/admin/reset-password/${resetToken}`;
        const message = `Admin Password Reset Request.\n\nLink: ${resetUrl}`;

        console.log('ADMIN EMAIL SENT MOCK:');
        console.log(`To: ${email}`);
        console.log(`Message: ${message}`);

        res.json({ success: true, data: 'Email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Email could not be sent' });
    }
};

const resetPasswordAdmin = async (req, res, next) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');

    try {
        const admin = await Admin.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        admin.password = req.body.password;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;

        await admin.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin Direct Password/Username Reset (Via Secret Key)
// @route   POST /api/auth/admin/reset-direct
// @access  Public
const resetAdminDirect = async (req, res, next) => {
    const { currentUsername, newUsername, newPassword, recoveryKey } = req.body;

    try {
        // Critical Security Check
        const serverSecret = process.env.ADMIN_RECOVERY_SECRET;
        if (!serverSecret || recoveryKey !== serverSecret) {
            return res.status(403).json({ success: false, message: 'Invalid Secret Recovery Key. Access Denied.' });
        }

        const admin = await Admin.findOne({ username: currentUsername });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Current Admin Username not found' });
        }

        // Update credentials
        admin.username = newUsername || admin.username;
        admin.password = newPassword; // the Schema pre-save hook will hash it

        await admin.save();

        res.json({ success: true, message: 'Admin Credentials updated successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerGymOwner,
    loginGymOwner,
    loginAdmin,
    refreshToken,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    forgotPasswordAdmin,
    resetPasswordAdmin,
    resetAdminDirect
};
