const CoachProfile = require('../models/CoachProfile');
const User = require('../models/User');

/**
 * Coaches can reserve courts before finishing public profile setup.
 * Creates a minimal CoachProfile so availability slots can be saved.
 */
const ensureCoachProfile = async (userId) => {
    let profile = await CoachProfile.findOne({ user: userId });
    if (profile) return { profile, created: false };

    const user = await User.findById(userId);
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        throw err;
    }

    try {
        profile = await CoachProfile.create({
            user: userId,
            experience: 1,
            hourlyRate: 1500,
            bio: `Badminton coaching with ${user.name || 'SportsSphere coach'}. Profile details can be updated anytime.`,
            specialization: ['technique'],
            location: { city: user.city || '' },
            isActive: true
        });
        return { profile, created: true };
    } catch (error) {
        if (error.code === 11000) {
            const existing = await CoachProfile.findOne({ user: userId });
            if (existing) return { profile: existing, created: false };
        }
        throw error;
    }
};

module.exports = { ensureCoachProfile };
