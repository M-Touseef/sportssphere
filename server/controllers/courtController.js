const Court = require('../models/Court');
const Booking = require('../models/Booking');

// @desc    Get all courts with filtering
// @route   GET /api/courts
// @access  Public
exports.getCourts = async (req, res, next) => {
    try {
        const { city, minPrice, maxPrice, surfaceType } = req.query;
        let query = {};

        if (city) {
            query['location.city'] = { $regex: city, $options: 'i' };
        }

        if (minPrice || maxPrice) {
            query.pricePerHour = {};
            if (minPrice) query.pricePerHour.$gte = Number(minPrice);
            if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
        }

        if (surfaceType) {
            query.surfaceType = surfaceType;
        }

        const courts = await Court.find(query);

        res.status(200).json({
            success: true,
            count: courts.length,
            data: courts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single court
// @route   GET /api/courts/:id
// @access  Public
exports.getCourt = async (req, res, next) => {
    try {
        const court = await Court.findById(req.params.id).populate('owner', 'name email');

        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        res.status(200).json({
            success: true,
            data: court
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new court
// @route   POST /api/courts
// @access  Private (Organizer/Admin)
exports.createCourt = async (req, res, next) => {
    try {
        // Add user to body
        req.body.owner = req.user.id;

        const court = await Court.create(req.body);

        res.status(201).json({
            success: true,
            data: court
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get court availability
// @route   GET /api/courts/:id/availability
// @access  Public
const Match = require('../models/Match');
const SparringAvailability = require('../models/SparringAvailability');

// @desc    Get court availability
// @route   GET /api/courts/:id/availability
// @access  Public
exports.getAvailability = async (req, res, next) => {
    try {
        const { date } = req.query; // YYYY-MM-DD
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const court = await Court.findById(req.params.id);
        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        // Normalize date to start of day in local time (same as createBooking)
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Get all regular bookings
        const bookings = await Booking.find({
            court: req.params.id,
            date: startOfDay, // Use exact match like createBooking for consistency
            status: { $nin: ['cancelled'] }
        }).select('startTime endTime status');

        // 2. Get all tournament matches scheduled for this court
        // Note: Match.court is a String in the model, we filter by court name
        const matches = await Match.find({
            court: court.name,
            scheduledTime: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: { $nin: ['cancelled'] }
        }).select('scheduledTime');

        // 3. Get all sparring availability slots for this court
        const sparringSlots = await SparringAvailability.find({
            court: req.params.id,
            date: startOfDay,
            status: { $in: ['PENDING', 'BOOKED'] }
        }).select('startTime');

        // Generate all possible slots based on opening/closing time
        const slots = [];
        let currentHour = parseInt(court.openingTime.split(':')[0]);
        const closeHour = parseInt(court.closingTime.split(':')[0]);

        while (currentHour < closeHour) {
            const timeString = `${currentHour.toString().padStart(2, '0')}:00`;

            // Check if this slot is booked via regular booking
            const isBookedViaBooking = bookings.some(booking => booking.startTime === timeString);

            // Check if this slot is taken by a tournament match
            const isBookedViaMatch = matches.some(match => {
                const matchTime = new Date(match.scheduledTime);
                const matchTimeString = `${matchTime.getHours().toString().padStart(2, '0')}:00`;
                return matchTimeString === timeString;
            });

            // Check if this slot is taken by a pending/booked sparring slot
            const isBookedViaSparring = sparringSlots.some(slot => slot.startTime === timeString);

            slots.push({
                time: timeString,
                available: !isBookedViaBooking && !isBookedViaMatch && !isBookedViaSparring
            });

            currentHour++;
        }

        res.status(200).json({
            success: true,
            data: slots
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Update court
// @route   PUT /api/courts/:id
// @access  Private (Organizer/Admin, owner or admin)
exports.updateCourt = async (req, res, next) => {
    try {
        const court = await Court.findById(req.params.id);

        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        if (court.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this court' });
        }

        const payload = { ...req.body };
        delete payload.owner;

        const updated = await Court.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete court
// @route   DELETE /api/courts/:id
// @access  Private (Organizer/Admin)
exports.deleteCourt = async (req, res, next) => {
    try {
        const court = await Court.findById(req.params.id);

        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        // Make sure user is court owner or admin
        if (court.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this court' });
        }

        await court.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get logged in user's courts
// @route   GET /api/courts/my
// @access  Private
exports.getMyCourts = async (req, res, next) => {
    try {
        const courts = await Court.find({ owner: req.user.id });

        res.status(200).json({
            success: true,
            count: courts.length,
            data: courts
        });
    } catch (error) {
        next(error);
    }
};
