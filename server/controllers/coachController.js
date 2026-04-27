const CoachProfile = require('../models/CoachProfile');
const User = require('../models/User');

// @desc    Create or update coach profile
// @route   POST /api/coaches/profile
// @access  Private (Coach only)
exports.createOrUpdateProfile = async (req, res) => {
    try {
        const profileData = {
            user: req.user.id,
            ...req.body
        };

        let profile = await CoachProfile.findOne({ user: req.user.id });

        if (profile) {
            // Update existing profile
            profile = await CoachProfile.findOneAndUpdate(
                { user: req.user.id },
                profileData,
                { new: true, runValidators: true }
            ).populate('user', 'name email city');
        } else {
            // Create new profile
            profile = await CoachProfile.create(profileData);
            profile = await profile.populate('user', 'name email city');
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get all coaches with filtering
// @route   GET /api/coaches
// @access  Public
exports.getCoaches = async (req, res) => {
    try {
        const { city, specialization, skillLevel, minRate, maxRate, court, paymentType } = req.query;
        let query = { isActive: true };

        if (city) {
            query['location.city'] = { $regex: city, $options: 'i' };
        }

        if (specialization) {
            query.specialization = specialization;
        }

        // Filter by User skillLevel
        if (skillLevel) {
            const users = await User.find({ skillLevel }).select('_id');
            const userIds = users.map(user => user._id);
            query.user = { $in: userIds };
        }

        // Fee filtering
        if (minRate || maxRate) {
            const min = Number(minRate) || 0;
            const max = Number(maxRate) || 1000000;

            if (paymentType === 'monthly') {
                query.monthlyFee = { $gte: min, $lte: max };
            } else {
                // Default to hourly
                query.hourlyRate = { $gte: min, $lte: max };
            }
        }

        const coaches = await CoachProfile.find(query)
            .populate('user', 'name email city skillLevel')
            .sort({ 'rating.average': -1 });

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

// @desc    Get single coach profile
// @route   GET /api/coaches/:id
// @access  Public
exports.getCoachProfile = async (req, res) => {
    try {
        const profile = await CoachProfile.findById(req.params.id)
            .populate('user', 'name email city phone');

        if (!profile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Coach profile not found' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get my coach profile
// @route   GET /api/coaches/me
// @access  Private (Coach)
exports.getMyProfile = async (req, res) => {
    try {
        const profile = await CoachProfile.findOne({ user: req.user.id })
            .populate('user', 'name email city phone')
            .populate('availability.court', 'name location');

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
// @desc    Get coach availability
// @route   GET /api/coaches/:id/availability
// @access  Public
exports.getCoachAvailability = async (req, res) => {
    try {
        const profile = await CoachProfile.findById(req.params.id).select('availability');

        if (!profile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        res.status(200).json({
            success: true,
            data: profile.availability
        });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Coach profile not found' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Add availability slot to coach profile
// @route   POST /api/coaches/availability
// @access  Private (Coach)
exports.addAvailabilitySlot = async (req, res) => {
    try {
        const { day, startTime, endTime, court, maxStudents } = req.body;

        if (!day || !startTime || !endTime) {
            return res.status(400).json({ error: 'Please provide day, startTime, and endTime' });
        }

        const profile = await CoachProfile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        // Check for overlaps
        const hasOverlap = profile.availability.some(slot =>
            slot.day === day &&
            ((startTime >= slot.startTime && startTime < slot.endTime) ||
                (endTime > slot.startTime && endTime <= slot.endTime) ||
                (startTime <= slot.startTime && endTime >= slot.endTime))
        );

        if (hasOverlap) {
            return res.status(400).json({ error: 'Slot overlaps with existing availability' });
        }

        profile.availability.push({ day, startTime, endTime, court, maxStudents: maxStudents || 1 });
        await profile.save();

        // Populate court info for the response
        await profile.populate('availability.court', 'name location');

        res.status(200).json({
            success: true,
            data: profile.availability
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Update availability slot
// @route   PUT /api/coaches/availability/:slotId
// @access  Private (Coach)
exports.updateAvailabilitySlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        const { day, startTime, endTime, court, maxStudents } = req.body;

        if (!day || !startTime || !endTime) {
            return res.status(400).json({ error: 'Please provide day, startTime, and endTime' });
        }

        const profile = await CoachProfile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        const slot = profile.availability.id(slotId);
        if (!slot) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        const hasOverlap = profile.availability.some((s) =>
            s._id.toString() !== slotId &&
            s.day === day &&
            ((startTime >= s.startTime && startTime < s.endTime) ||
                (endTime > s.startTime && endTime <= s.endTime) ||
                (startTime <= s.startTime && endTime >= s.endTime))
        );

        if (hasOverlap) {
            return res.status(400).json({ error: 'Slot overlaps with existing availability' });
        }

        slot.day = day;
        slot.startTime = startTime;
        slot.endTime = endTime;
        if (court) slot.court = court;
        slot.maxStudents = maxStudents != null ? maxStudents : 1;

        await profile.save();
        await profile.populate('availability.court', 'name location');

        res.status(200).json({
            success: true,
            data: profile.availability
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Remove availability slot from coach profile
// @route   DELETE /api/coaches/availability/:slotId
// @access  Private (Coach)
exports.removeAvailabilitySlot = async (req, res) => {
    try {
        const profile = await CoachProfile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        profile.availability.pull({ _id: req.params.slotId });
        await profile.save();

        // Populate court info for the response
        await profile.populate('availability.court', 'name location');

        res.status(200).json({
            success: true,
            data: profile.availability
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
