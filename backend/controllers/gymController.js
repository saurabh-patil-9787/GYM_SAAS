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
    const { duration } = req.body; // duration in months (1, 3, 6, 12)

    try {
        const gym = await Gym.findById(req.params.id);

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Calculate new expiry date
        // If current expiry is in future, add to it. If passed, add to NOW.
        let baseDate = new Date();
        if (gym.expiryDate && new Date(gym.expiryDate) > new Date()) {
            baseDate = new Date(gym.expiryDate);
        }

        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + Number(duration));

        gym.expiryDate = newExpiry;
        gym.isActive = true;

        await gym.save();

        res.json({
            _id: gym._id,
            gymName: gym.gymName,
            expiryDate: gym.expiryDate,
            isActive: gym.isActive,
            message: `Gym renewed successfully for ${duration} months.`
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createGym, getMyGym, updateGym, getAllGyms, toggleGymStatus, renewGym };
