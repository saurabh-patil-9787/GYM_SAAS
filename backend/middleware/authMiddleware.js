const jwt = require('jsonwebtoken');
const GymOwner = require('../models/GymOwner');
const Admin = require('../models/Admin');
const Gym = require('../models/Gym');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await GymOwner.findById(decoded.id).select('-password');

            if (user) {
                req.user = user;
                req.gymOwner = user; // Keep for backward compatibility if needed
            } else {
                const admin = await Admin.findById(decoded.id).select('-password');
                if (admin) {
                    req.user = admin;
                    req.admin = admin; // Keep for backward compatibility
                }
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.admin) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const requireActivePlan = async (req, res, next) => {
    if (req.admin) {
        return next();
    }
    
    try {
        const gym = await Gym.findOne({ owner: req.user._id });
        if (!gym) {
            return res.status(404).json({ message: 'No gym associated with this account.' });
        }
        
        let checkDate = gym.expiryDate;
        let requiresSave = false;
        if (!checkDate) {
            let base = gym.joiningDate ? new Date(gym.joiningDate) : new Date();
            base.setDate(base.getDate() + 30);
            checkDate = base;
            gym.expiryDate = checkDate;
            requiresSave = true;
        }
        
        const isExpiredByDate = new Date() > new Date(checkDate);
        if (isExpiredByDate || gym.planStatus === 'EXPIRED') {
            if (isExpiredByDate && gym.planStatus !== 'EXPIRED') {
                gym.planStatus = 'EXPIRED';
                requiresSave = true;
            }
            if (requiresSave) await gym.save();
            return res.status(402).json({ message: 'Payment Required: Your subscription has expired. Please renew to continue.' });
        } else if (requiresSave) {
            await gym.save();
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking subscription status.' });
    }
};

module.exports = { protect, adminOnly, requireActivePlan };
