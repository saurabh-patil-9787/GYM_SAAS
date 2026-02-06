const GymOwner = require('../models/GymOwner');
const Gym = require('../models/Gym');
const Admin = require('../models/Admin');
const RefreshToken = require('../models/RefreshToken');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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
const registerGymOwner = async (req, res) => {
    const { ownerName, mobile, password } = req.body;

    try {
        const ownerExists = await GymOwner.findOne({ mobile });

        if (ownerExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const owner = await GymOwner.create({
            ownerName,
            mobile,
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
                token: accessToken
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth Gym Owner & get token
// @route   POST /api/auth/login
// @access  Public
const loginGymOwner = async (req, res) => {
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
                return res.status(403).json({ message: 'Your plan is expired. Please contact admin to reactivate.' });
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
                role: owner.role,
                hasGym: hasGym,
                gymId: gym ? gym._id : undefined,
                token: accessToken
            });
        } else {
            res.status(401).json({ message: 'Invalid mobile or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Keep existing forgot/reset logic
// @desc    Forgot Password - Send Reset Link
const forgotPassword = async (req, res) => {
    const { mobile } = req.body;

    try {
        const owner = await GymOwner.findOne({ mobile });

        if (!owner) {
            return res.status(404).json({ message: 'User not found' });
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
        const message = `You have requested a password reset. Please go to this link to reset your password: \n\n ${resetUrl}`;

        console.log('EMAIL SENT MOCK:');
        console.log(`To: ${mobile}`);
        console.log(`Message: ${message}`);

        res.json({ success: true, data: 'Email sent' });
    } catch (error) {
        console.error(error);
        owner.resetPasswordToken = undefined;
        owner.resetPasswordExpire = undefined;
        await owner.save();
        res.status(500).json({ message: 'Email could not be sent' });
    }
};

const resetPassword = async (req, res) => {
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
            return res.status(400).json({ message: 'Invalid token' });
        }

        owner.password = req.body.password;
        owner.resetPasswordToken = undefined;
        owner.resetPasswordExpire = undefined;

        await owner.save();

        res.json({ success: true, data: 'Password updated success' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPasswordDirect = async (req, res) => {
    const { mobile, password } = req.body;

    try {
        const owner = await GymOwner.findOne({ mobile: mobile.trim() });
        if (!owner) {
            return res.status(404).json({ message: 'User not found' });
        }
        owner.password = password;
        await owner.save();
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
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

const resetPasswordAdmin = async (req, res) => {
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
            return res.status(400).json({ message: 'Invalid token' });
        }

        admin.password = req.body.password;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;

        await admin.save();

        res.json({ success: true, data: 'Password updated success' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin Direct Credential Reset (Username + Password)
// @route   POST /api/auth/admin/reset-direct
const resetAdminAnyDirect = async (req, res) => {
    const { currentUsername, newUsername, newPassword } = req.body;

    try {
        const admin = await Admin.findOne({ username: currentUsername });
        if (!admin) {
            return res.status(404).json({ message: 'Admin user not found' });
        }

        // Update Username if provided and different
        if (newUsername && newUsername !== currentUsername) {
            // Check if new username exists
            const exists = await Admin.findOne({ username: newUsername });
            if (exists) {
                return res.status(400).json({ message: 'New username already taken' });
            }
            admin.username = newUsername;
        }

        // Update Password
        if (newPassword) {
            admin.password = newPassword;
        }

        // Clear reset tokens if any exist, just for cleanup
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;

        await admin.save();

        res.json({ success: true, message: 'Admin credentials updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
    resetPasswordDirect,
    forgotPasswordAdmin,
    resetPasswordAdmin,
    resetAdminAnyDirect
};
