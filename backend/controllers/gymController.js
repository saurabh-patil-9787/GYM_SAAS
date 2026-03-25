const Gym = require('../models/Gym');
const GymOwner = require('../models/GymOwner');

// @desc    Create a new Gym
// @route   POST /api/gym
// @access  Private (Owner)
// @desc    Create a new Gym
// @route   POST /api/gym
// @access  Private (Owner)
const createGym = async (req, res, next) => {
    const { gymName, city, pincode, joiningDate } = req.body;

    try {
        let gym = await Gym.findOne({ owner: req.gymOwner._id });

        // Idempotency / Recovery: If gym exists, just ensure it's linked and return it.
        // This handles cases where a previous request created the gym but failed to update the owner.
        if (gym) {
            console.log("Gym already exists for owner, linking and returning:", gym._id);
            if (!req.gymOwner.gym || req.gymOwner.gym.toString() !== gym._id.toString()) {
                req.gymOwner.gym = gym._id;
                await req.gymOwner.save();
            }
            return res.status(200).json(gym);
        }

        gym = await Gym.create({
            owner: req.gymOwner._id,
            gymName,
            city,
            pincode,
            joiningDate
        });

        // Link gym to owner
        req.gymOwner.gym = gym._id;
        await req.gymOwner.save();

        res.status(201).json(gym);
    } catch (error) {
        console.error("Error creating gym:", error);
        next(error);
    }
};

// @desc    Get My Gym Details
// @route   GET /api/gym/me
// @access  Private (Owner)
const getMyGym = async (req, res, next) => {
    try {
        const gym = await Gym.findOne({ owner: req.gymOwner._id });
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }
        res.json(gym);
    } catch (error) {
        next(error);
    }
};

const cloudinary = require('../utils/cloudinary'); // for image deletion

// @desc    Update Gym Details
// @route   PUT /api/gym/me
// @access  Private (Owner)
const updateGym = async (req, res, next) => {
    try {
        let gym = await Gym.findOne({ owner: req.gymOwner._id });
        
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }
        
        // Ownership validation
        if (gym.owner.toString() !== req.gymOwner._id.toString()) {
             return res.status(403).json({ message: "Unauthorized" });
        }

        const { gymName, city, pincode } = req.body;
        
        gym.gymName = gymName || gym.gymName;
        gym.city = city || gym.city;
        gym.pincode = pincode || gym.pincode;

        if (req.body.removeLogo === 'true' && gym.logoPublicId) {
            try {
                await cloudinary.uploader.destroy(gym.logoPublicId);
            } catch (err) {
                console.error("Cloudinary destroy error:", err);
            }
            gym.logoUrl = null;
            gym.logoPublicId = null;
        }

        if (req.file) {
            // Delete old logo if exists
            if (gym.logoPublicId) {
                try {
                    await cloudinary.uploader.destroy(gym.logoPublicId);
                } catch (err) {
                    console.error("Cloudinary destroy error:", err);
                }
            }
            gym.logoUrl = req.file.path;
            gym.logoPublicId = req.file.filename;
        }

        await gym.save();

        res.json(gym);
    } catch (error) {
        next(error);
    }
};

// @desc    Get All Gyms (Admin)
// @route   GET /api/gym/all
// @access  Private (Admin)
const getAllGyms = async (req, res, next) => {
    try {
        const gyms = await Gym.find().populate('owner', 'ownerName mobile email');
        res.json(gyms);
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle Gym Status (Admin)
// @route   PUT /api/gym/:id/toggle
// @access  Private (Admin)
const toggleGymStatus = async (req, res, next) => {
    try {
        const gym = await Gym.findById(req.params.id);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        gym.isActive = !gym.isActive;
        await gym.save();

        res.json({ message: `Gym ${gym.isActive ? 'activated' : 'deactivated'}`, isActive: gym.isActive });
    } catch (error) {
        next(error);
    }
};


// @desc    Renew Gym Plan
// @route   PUT /api/gym/renew/:id
// @access  Private (Admin)
const renewGym = async (req, res, next) => {
    const { duration, renewalType, planStartDate } = req.body; // duration in months (1, 3, 6, 12)

    try {
        const gym = await Gym.findById(req.params.id);

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        let baseDate;

        if (renewalType === 'Start Fresh') {
            baseDate = planStartDate ? new Date(planStartDate) : new Date();
        } else {
            // For 'Continue Plan' strictly respect the existing expiry date, even if in the past
            baseDate = gym.expiryDate ? new Date(gym.expiryDate) : new Date(gym.joiningDate || Date.now());
        }

        // Calculate exact days based on duration
        let daysToAdd = 30; // Default 1 month
        const durationNum = Number(duration);
        if (durationNum === 1) daysToAdd = 30;
        else if (durationNum === 3) daysToAdd = 90;
        else if (durationNum === 6) daysToAdd = 180;
        else if (durationNum === 12) daysToAdd = 365;
        else daysToAdd = durationNum * 30; // Fallback for other arbitrary months

        const newExpiry = new Date(baseDate);
        newExpiry.setDate(newExpiry.getDate() + daysToAdd);

        gym.expiryDate = newExpiry;
        gym.isActive = true;

        await gym.save();

        res.json({
            _id: gym._id,
            gymName: gym.gymName,
            expiryDate: gym.expiryDate,
            isActive: gym.isActive,
            message: `Gym renewed successfully for ${daysToAdd} days.`
        });
    } catch (error) {
        next(error);
    }
};

const Member = require('../models/Member');

// @desc    Delete Gym and associated data
// @route   DELETE /api/gym/:id
// @access  Private (Admin)
const deleteGym = async (req, res, next) => {
    try {
        const gym = await Gym.findById(req.params.id);

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Optional: Remove gym logo from Cloudinary
        if (gym.logoPublicId) {
            try {
                await cloudinary.uploader.destroy(gym.logoPublicId);
            } catch (err) {
                console.error("Cloudinary destroy error for gym logo:", err);
            }
        }

        // Delete associated gym owner
        if (gym.owner) {
            await GymOwner.deleteOne({ _id: gym.owner });
        }

        // Delete all members of this gym
        await Member.deleteMany({ gym: gym._id });

        // Finally delete the gym document
        await Gym.deleteOne({ _id: gym._id });

        res.json({ message: 'Gym and associated data completely removed successfully' });
    } catch (error) {
        console.error("Error deleting gym:", error);
        next(error);
    }
};

module.exports = { createGym, getMyGym, updateGym, getAllGyms, toggleGymStatus, renewGym, deleteGym };
