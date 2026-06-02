const ProfessionalProfile = require('../models/ProfessionalProfile');
const User = require('../models/User');

// =============================================================================
// PROFILE MANAGEMENT (Professional Players Only)
// =============================================================================

// @desc    Create professional profile
// @route   POST /api/professional/profile
// @access  Private (Professional only)
exports.createProfile = async (req, res) => {
    try {
        // Check if profile already exists
        const existingProfile = await ProfessionalProfile.findOne({ user: req.user.id });
        if (existingProfile) {
            return res.status(400).json({
                success: false,
                error: 'Professional profile already exists'
            });
        }

        const { matchFee, bio, experienceYears, specializations } = req.body;

        const profile = await ProfessionalProfile.create({
            user: req.user.id,
            matchFee,
            bio,
            experienceYears,
            specializations
        });

        res.status(201).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Create profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Get my professional profile
// @route   GET /api/professional/profile/me
// @access  Private (Professional only)
exports.getMyProfile = async (req, res) => {
    try {
        const profile = await ProfessionalProfile.findOne({ user: req.user.id })
            .populate('user', 'name email city rank achievements profilePicture');

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found. Please create one first.'
            });
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Get my profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Update my professional profile
// @route   PUT /api/professional/profile
// @access  Private (Professional only)
exports.updateProfile = async (req, res) => {
    try {
        const { matchFee, bio, experienceYears, specializations, isActive } = req.body;

        const profile = await ProfessionalProfile.findOneAndUpdate(
            { user: req.user.id },
            { matchFee, bio, experienceYears, specializations, isActive },
            { new: true, runValidators: true }
        ).populate('user', 'name email city rank achievements profilePicture');

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found'
            });
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// =============================================================================
// PUBLIC VIEWS (For Non-Professional Players)
// =============================================================================

// @desc    Get public professional profile by user ID
// @route   GET /api/professional/:id
// @access  Public
exports.getPublicProfile = async (req, res) => {
    try {
        const profile = await ProfessionalProfile.findOne({
            user: req.params.id,
            isActive: true
        }).populate('user', 'name city rank achievements skillLevel profilePicture');

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Professional profile not found'
            });
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Get public profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Get all active professional players
// @route   GET /api/professionals
// @access  Public
exports.getAllProfessionals = async (req, res) => {
    try {
        const { city, maxFee, specialization } = req.query;

        const query = { isActive: true };

        // Build filter for user's city
        let userFilter = {};
        if (city) {
            userFilter.city = city;
        }

        let profiles = await ProfessionalProfile.find(query)
            .populate({
                path: 'user',
                select: 'name city rank achievements skillLevel profilePicture',
                match: Object.keys(userFilter).length > 0 ? userFilter : undefined
            })
            .sort({ createdAt: -1 });

        // Filter out profiles where user didn't match city filter
        profiles = profiles.filter(p => p.user !== null);

        // Apply additional filters
        if (maxFee) {
            profiles = profiles.filter(p => p.matchFee <= parseFloat(maxFee));
        }
        if (specialization) {
            profiles = profiles.filter(p => p.specializations.includes(specialization));
        }

        res.status(200).json({
            success: true,
            count: profiles.length,
            data: profiles
        });
    } catch (error) {
        console.error('Get all professionals error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
