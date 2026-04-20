const jwt = require('jsonwebtoken');
const GymOwner = require('../models/GymOwner');
const Admin = require('../models/Admin');
const Gym = require('../models/Gym');

// AUDIT FIX 11: In-memory cache to prevent DB scan on every request
const planCache = new Map();
const PLAN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    // AUDIT FIX 15: Use explicit role string check instead of truthy check
    if (!req.admin || req.admin.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

const requireActivePlan = async (req, res, next) => {
    if (req.admin) {
        return next();
    }

    // AUDIT FIX 11: Check plan cache before hitting the DB
    const cacheKey = req.user._id.toString();
    const cached = planCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
        if (cached.isActive) return next();
        return res.status(402).json({ message: cached.message || 'Subscription expired or inactive' });
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
            // AUDIT FIX 11: Cache the inactive result to avoid repeat DB hits
            const expiredMsg = 'Payment Required: Your subscription has expired. Please renew to continue.';
            planCache.set(cacheKey, { isActive: false, message: expiredMsg, expiresAt: Date.now() + PLAN_CACHE_TTL });
            return res.status(402).json({ message: expiredMsg });
        } else if (requiresSave) {
            await gym.save();
        }

        // AUDIT FIX 11: Cache the active result
        planCache.set(cacheKey, { isActive: true, expiresAt: Date.now() + PLAN_CACHE_TTL });
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking subscription status.' });
    }
};

// AUDIT FIX 11: Exported so subscription renewal can bust the cache immediately
const invalidatePlanCache = (gymOwnerId) => {
    planCache.delete(gymOwnerId.toString());
};

module.exports = { protect, adminOnly, requireActivePlan, invalidatePlanCache };
