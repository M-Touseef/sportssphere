const User = require('../models/User');

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get all coaches
// @route   GET /api/users/coaches
// @access  Public
exports.getCoaches = async (req, res) => {
    try {
        const coaches = await User.find({ role: 'professional' }).select('-password');
        res.status(200).json({
            success: true,
            count: coaches.length,
            data: coaches
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get all organizers
// @route   GET /api/users/organizers
// @access  Public
exports.getOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ role: 'professional' }).select('-password');
        res.status(200).json({
            success: true,
            count: organizers.length,
            data: organizers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
