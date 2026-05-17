const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Session = require('../models/Session');
const Match = require('../models/Match');
const SparringAvailability = require('../models/SparringAvailability');
const { createNotification } = require('./notificationController');
const { normalizeToHour } = require('../utils/timeUtils');

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const assertCourtSlotAvailable = async ({ courtId, bookingDate, startTime, excludeBookingId }) => {
    const query = {
        court: courtId,
        date: bookingDate,
        startTime,
        status: { $nin: ['cancelled'] }
    };
    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const existingBooking = await Booking.findOne(query);
    if (existingBooking) {
        const err = new Error('Court slot already booked');
        err.statusCode = 400;
        throw err;
    }

    const startOfDay = new Date(bookingDate);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const court = await Court.findById(courtId);
    const conflictingMatch = await Match.findOne({
        court: court?.name,
        scheduledTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['cancelled'] }
    });

    if (conflictingMatch) {
        const matchTime = new Date(conflictingMatch.scheduledTime);
        const matchTimeString = `${matchTime.getHours().toString().padStart(2, '0')}:00`;
        if (matchTimeString === startTime) {
            const err = new Error('Court slot is reserved for a tournament match');
            err.statusCode = 400;
            throw err;
        }
    }

    const conflictingSparring = await SparringAvailability.findOne({
        court: courtId,
        date: bookingDate,
        startTime,
        status: { $in: ['PENDING', 'BOOKED'] }
    });

    if (conflictingSparring) {
        const err = new Error('Court slot is reserved for a sparring session');
        err.statusCode = 400;
        throw err;
    }

    const conflictingSession = await Session.findOne({
        court: courtId,
        date: bookingDate,
        startTime,
        status: { $nin: ['cancelled'] }
    });

    if (conflictingSession) {
        const err = new Error('Court slot already has a coaching session');
        err.statusCode = 400;
        throw err;
    }
};

/** Validate coach owns booking and it can back a weekly slot */
exports.validateCoachCourtBookingForSlot = async (coachUserId, courtBookingId, { day, startTime, endTime }) => {
    const booking = await Booking.findById(courtBookingId).populate('court', 'name location');
    if (!booking) {
        const err = new Error('Court reservation not found');
        err.statusCode = 404;
        throw err;
    }
    if (booking.user.toString() !== coachUserId.toString()) {
        const err = new Error('Not authorized for this court reservation');
        err.statusCode = 401;
        throw err;
    }
    if (booking.purpose !== 'coach_reservation' || booking.status === 'cancelled') {
        const err = new Error('Invalid or cancelled court reservation');
        err.statusCode = 400;
        throw err;
    }

    const bookingDay = days[new Date(booking.date).getDay()];
    if (bookingDay !== day) {
        const err = new Error('Weekly slot day must match your court reservation day');
        err.statusCode = 400;
        throw err;
    }
    if (startTime < booking.startTime || endTime > booking.endTime) {
        const err = new Error('Session times must fall within your court reservation window');
        err.statusCode = 400;
        throw err;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(booking.date) < today) {
        const err = new Error('Court reservation has expired');
        err.statusCode = 400;
        throw err;
    }

    return booking;
};

// @desc    Coach reserves a court before offering sessions
// @route   POST /api/coaches/court-bookings
// @access  Private (Coach)
exports.createCoachCourtBooking = async (req, res) => {
    try {
        const { courtId, date, startTime: rawStart, endTime: rawEnd } = req.body;
        const startTime = normalizeToHour(rawStart);
        const endTime = normalizeToHour(rawEnd);

        if (!courtId || !date || !startTime || !endTime) {
            return res.status(400).json({ error: 'Please provide courtId, date, startTime, and endTime' });
        }

        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (bookingDate < today) {
            return res.status(400).json({ error: 'Cannot reserve a court in the past' });
        }

        await assertCourtSlotAvailable({ courtId, bookingDate, startTime });

        const start = parseInt(startTime.split(':')[0], 10);
        const end = parseInt(endTime.split(':')[0], 10);
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
            return res.status(400).json({ error: 'Invalid time range' });
        }

        const durationHours = end - start;
        const totalPrice = (court.pricePerHour || 0) * durationHours;

        const booking = await Booking.create({
            court: courtId,
            user: req.user.id,
            date: bookingDate,
            startTime,
            endTime,
            totalPrice,
            status: 'confirmed',
            paymentStatus: 'pending',
            purpose: 'coach_reservation'
        });

        try {
            await createNotification({
                userId: court.owner,
                type: 'booking',
                title: 'Coach Court Reservation',
                message: `A coach reserved ${court.name} on ${bookingDate.toLocaleDateString()} at ${startTime}.`,
                meta: {
                    kind: 'coach_court_reservation',
                    bookingId: booking._id,
                    courtId: court._id
                }
            });
        } catch (notifyErr) {
            console.error('Failed to notify court owner of coach reservation:', notifyErr);
        }

        const populated = await Booking.findById(booking._id).populate('court', 'name location');

        res.status(201).json({
            success: true,
            data: populated
        });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error' });
    }
};

// @desc    List coach's upcoming court reservations
// @route   GET /api/coaches/court-bookings
// @access  Private (Coach)
exports.getCoachCourtBookings = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookings = await Booking.find({
            user: req.user.id,
            purpose: 'coach_reservation',
            status: { $ne: 'cancelled' },
            date: { $gte: today }
        })
            .populate('court', 'name location pricePerHour')
            .sort({ date: 1, startTime: 1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Cancel coach court reservation
// @route   PUT /api/coaches/court-bookings/:id/cancel
// @access  Private (Coach)
exports.cancelCoachCourtBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        if (booking.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }
        if (booking.purpose !== 'coach_reservation') {
            return res.status(400).json({ error: 'Not a coach court reservation' });
        }

        const activeSession = await Session.findOne({
            courtBooking: booking._id,
            status: { $in: ['pending', 'pending_payment', 'confirmed'] }
        });

        if (activeSession) {
            return res.status(400).json({
                error: 'Cannot cancel: an active coaching session is linked to this reservation'
            });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.assertCourtSlotAvailable = assertCourtSlotAvailable;
