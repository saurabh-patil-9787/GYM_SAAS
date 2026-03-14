const GymOwner = require('../models/GymOwner');

// @desc    Update Gym Owner Email
// @route   PUT /api/gym-owner/update-email
// @access  Private
const updateEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        // Find owner
        const owner = await GymOwner.findById(req.user._id);
        if (!owner) {
            return res.status(404).json({ success: false, message: 'Owner not found' });
        }

        // Email uniqueness validation is handled by mongoose via duplicate key error (11000)
        // Which is caught by our global error middleware correctly now
        
        owner.email = email;
        await owner.save();

        res.json({
            success: true,
            message: 'Email updated successfully',
            email: owner.email
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { updateEmail };
