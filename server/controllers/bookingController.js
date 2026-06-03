const Booking = require('../models/Booking');
const Court = require('../models/Court');
const SparringSessionRequest = require('../models/SparringSessionRequest');
const SparringAvailability = require('../models/SparringAvailability');
const CoachProfile = require('../models/CoachProfile');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const Match = require('../models/Match');
const { createNotification } = require('./notificationController');
const { RESPONSE_DEADLINE_MS } = require('../constants/responseDeadlines');
const { normalizeToHour } = require('../utils/timeUtils');
const {
    notifyBookingCreated,
    notifyBookingConfirmed,
    notifyIncomingRequest
} = require('../services/emailNotificationService');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
    try {
        if (req.user.role === 'organizer') {
            return res.status(403).json({
                error: 'Court owners do not need to reserve courts. Manage your venues from My Courts.'
            });
        }

        const { courtId, date, startTime: rawStart, endTime: rawEnd, proPlayerId, slotId } = req.body;
        const startTime = normalizeToHour(rawStart);
        const endTime = normalizeToHour(rawEnd);
        console.log('Booking request received:', { courtId, date, startTime, endTime, proPlayerId, slotId });

        if (!courtId || !date || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required booking fields' });
        }

        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        let proFee = 0;
        if (proPlayerId) {
            // Check both CoachProfile and ProfessionalProfile
            let proProfile = await CoachProfile.findOne({ user: proPlayerId });
            let isCoach = true;

            if (!proProfile) {
                proProfile = await ProfessionalProfile.findOne({ user: proPlayerId });
                isCoach = false;
            }

            if (!proProfile) {
                return res.status(404).json({ error: 'Professional/Coach profile not found' });
            }

            // Set appropriate fee
            proFee = isCoach ? (proProfile.hourlyRate || 0) : (proProfile.matchFee || 0);

            if (!slotId) {
                // If no manual slotId, verify recurring availability
                if (!proProfile.availability || !Array.isArray(proProfile.availability)) {
                    return res.status(400).json({ error: 'Professional has no availability defined' });
                }

                const bookingDate = new Date(date);
                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayOfWeek = days[bookingDate.getDay()];

                const hasRecurringSlot = proProfile.availability.some(slot =>
                    slot.day === dayOfWeek &&
                    slot.startTime === startTime
                );

                if (!hasRecurringSlot) {
                    return res.status(400).json({ error: 'Selected professional is not available for this recurring slot' });
                }
            } else {
                // Verify manual slot
                const slot = await SparringAvailability.findById(slotId);
                if (!slot || slot.status !== 'OPEN') {
                    return res.status(400).json({ error: 'Selected professional availability slot is no longer open' });
                }
            }
        }

        const pricePerHour = court.pricePerHour || 0;
        const totalPrice = pricePerHour + proFee;

        // Normalize date to start of day
        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);

        // EXTRA ROBUSTNESS: Ensure court is not booked by any means
        // 1. Regular Bookings
        const existingBooking = await Booking.findOne({
            court: courtId,
            date: bookingDate,
            startTime,
            status: { $nin: ['cancelled'] }
        });

        if (existingBooking) {
            return res.status(400).json({ error: 'Court slot already booked' });
        }

        // 2. Tournament Matches
        const startOfDay = new Date(bookingDate);
        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);

        const conflictingMatch = await Match.findOne({
            court: court.name,
            scheduledTime: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: { $nin: ['cancelled'] }
        });

        if (conflictingMatch) {
            const matchTime = new Date(conflictingMatch.scheduledTime);
            const matchTimeString = `${matchTime.getHours().toString().padStart(2, '0')}:00`;
            if (matchTimeString === startTime) {
                return res.status(400).json({ error: 'Court slot is reserved for a tournament match' });
            }
        }

        // 3. Sparring Slots (Manual)
        const conflictingSparring = await SparringAvailability.findOne({
            court: courtId,
            date: bookingDate,
            startTime,
            status: { $in: ['PENDING', 'BOOKED'] }
        });

        if (conflictingSparring) {
            return res.status(400).json({ error: 'Court slot is reserved for a professional sparring session' });
        }

        // Determine initial status
        // If pro selected: pending_pro
        // If no pro: pending_payment (mandatory payment)
        let status = 'pending_payment';
        let paymentStatus = 'pending';

        if (proPlayerId) {
            status = 'pending_pro';
            paymentStatus = 'pending';
        }

        const booking = await Booking.create({
            court: courtId,
            user: req.user.id,
            proPlayer: proPlayerId || null,
            date: bookingDate,
            startTime,
            endTime,
            totalPrice,
            status,
            paymentStatus
        });

        if (proPlayerId) {
            // Create Sparring Request
            const responseDeadline = new Date(Date.now() + RESPONSE_DEADLINE_MS);

            const sparringRequest = await SparringSessionRequest.create({
                requester: req.user.id,
                proPlayer: proPlayerId,
                availabilitySlot: slotId || null, // Optional for virtual slots
                booking: booking._id,
                responseDeadline,
                status: 'PENDING_RESPONSE'
            });

            // Update booking with the request link
            booking.sparringRequest = sparringRequest._id;
            await booking.save();

            // Update manual slot status to PENDING if applicable
            if (slotId) {
                await SparringAvailability.findByIdAndUpdate(slotId, { status: 'PENDING' });
            }

            // Notify selected coach/professional that they received a new request.
            try {
                await createNotification({
                    userId: proPlayerId,
                    type: 'booking',
                    title: 'New Sparring Request',
                    message: 'You received a new sparring/coaching request. Please respond within 30 minutes.',
                    meta: {
                        kind: 'incoming_sparring_request',
                        bookingId: booking._id,
                        requesterId: req.user.id
                    }
                });
            } catch (notifyErr) {
                console.error('Failed to create incoming sparring notification:', notifyErr);
            }

            await notifyIncomingRequest({
                recipientId: proPlayerId,
                requesterId: req.user.id,
                bookingId: booking._id,
                requestType: 'sparring/coaching'
            });
        }

        await notifyBookingCreated(booking._id);

        res.status(201).json({
            success: true,
            data: booking,
            message: proPlayerId ? 'Request sent to professional player' : 'Booking created. Please complete payment to confirm.'
        });
    } catch (error) {
        console.error('Create Booking Error:', error);
        next(error);
    }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('court', 'name location')
            .sort({ date: -1 });

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

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Make sure user owns booking
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ error: 'Not authorized' });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Confirm payment for booking
// @route   PUT /api/bookings/:id/pay
// @access  Private
exports.confirmPayment = async (req, res) => {
    try {
        if (req.user.role === 'organizer') {
            return res.status(403).json({
                error: 'Court owners do not need to pay for court reservations.'
            });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        if (booking.status !== 'pending_payment') {
            return res.status(400).json({ error: 'Booking is not awaiting payment' });
        }

        booking.status = 'confirmed';
        booking.paymentStatus = 'paid';
        await booking.save();

        await notifyBookingConfirmed(booking._id);

        res.status(200).json({
            success: true,
            data: booking,
            message: 'Payment confirmed and booking finalized.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
