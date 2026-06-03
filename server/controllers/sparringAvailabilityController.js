const SparringAvailability = require('../models/SparringAvailability'); // Legacy? Or for specific overrides?
const SparringSessionRequest = require('../models/SparringSessionRequest');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const CoachProfile = require('../models/CoachProfile');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const { createNotification } = require('./notificationController');
const { RESPONSE_DEADLINE_MS } = require('../constants/responseDeadlines');
const { normalizeToHour } = require('../utils/timeUtils');
const { normalizeArea } = require('../constants/lahoreAreas');
const {
    notifyIncomingRequest,
    notifyRequestStatusChanged
} = require('../services/emailNotificationService');

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const resolveUserId = (userRef) => {
    if (!userRef) return null;
    if (typeof userRef === 'string') return userRef;
    return userRef._id || userRef;
};

const notifySparringRequester = async (request, { title, message, status }) => {
    const requesterId = resolveUserId(request.requester);
    if (!requesterId) {
        console.error('Sparring notification skipped: missing requester on request', request._id);
        return;
    }

    try {
        await createNotification({
            userId: requesterId,
            type: 'booking',
            title,
            message,
            meta: {
                kind: 'sparring_request_status',
                status,
                requestId: request._id,
                bookingId: request.booking?._id || request.booking || null
            }
        });
    } catch (notifyErr) {
        console.error('Failed to create sparring status notification:', notifyErr);
    }

    await notifyRequestStatusChanged({
        requesterId,
        responderId: request.proPlayer,
        bookingId: request.booking?._id || request.booking || null,
        status
    });
};

// =============================================================================
// RECURRING AVAILABILITY MANAGEMENT (Professional Players)
// =============================================================================

// @desc    Add a recurring availability slot (Weekly)
// @route   POST /api/sparring/availability/recurring
// @access  Private (Professional only)
exports.addRecurringSlot = async (req, res) => {
    try {
        const { day, startTime: rawStart, endTime: rawEnd, sparringType } = req.body;
        const startTime = normalizeToHour(rawStart);
        const endTime = normalizeToHour(rawEnd);

        if (!day || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required fields: day, startTime, endTime' });
        }

        let profile = await ProfessionalProfile.findOne({ user: req.user.id });

        if (!profile) {
            // Create profile if not exists (should usually exist)
            profile = await ProfessionalProfile.create({
                user: req.user.id,
                matchFee: 0, // Default, client should probably set this elsewhere or here
                availability: []
            });
        }

        // Check for overlaps in existing recurring slots
        const hasOverlap = profile.availability.some(slot =>
            slot.day === day &&
            slot.isActive &&
            ((startTime >= slot.startTime && startTime < slot.endTime) ||
                (endTime > slot.startTime && endTime <= slot.endTime) ||
                (startTime <= slot.startTime && endTime >= slot.endTime))
        );

        if (hasOverlap) {
            return res.status(400).json({ error: 'This time slot overlaps with an existing weekly slot.' });
        }

        // Professionals define time only; requesters choose the venue when booking.
        const newSlot = {
            day,
            startTime,
            endTime,
            sparringType: sparringType || 'singles',
            isActive: true
        };

        profile.availability.push(newSlot);
        await profile.save();

        res.status(201).json({
            success: true,
            data: profile.availability
        });
    } catch (error) {
        console.error('Add Recurring Slot Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Update a recurring availability slot
// @route   PUT /api/sparring/availability/recurring/:slotId
// @access  Private (Professional only)
exports.updateRecurringSlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        const { day, startTime: rawStart, endTime: rawEnd, sparringType } = req.body;
        const startTime = normalizeToHour(rawStart);
        const endTime = normalizeToHour(rawEnd);

        if (!day || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required fields: day, startTime, endTime' });
        }

        const profile = await ProfessionalProfile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const slot = profile.availability.id(slotId);
        if (!slot) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        const hasOverlap = profile.availability.some(s =>
            s._id.toString() !== slotId &&
            s.day === day &&
            s.isActive &&
            ((startTime >= s.startTime && startTime < s.endTime) ||
                (endTime > s.startTime && endTime <= s.endTime) ||
                (startTime <= s.startTime && endTime >= s.endTime))
        );

        if (hasOverlap) {
            return res.status(400).json({ error: 'This time slot overlaps with an existing weekly slot.' });
        }

        slot.day = day;
        slot.startTime = startTime;
        slot.endTime = endTime;
        slot.court = undefined;
        slot.venue = undefined;
        if (sparringType) slot.sparringType = sparringType;

        await profile.save();

        res.status(200).json({
            success: true,
            data: profile.availability
        });
    } catch (error) {
        console.error('Update Recurring Slot Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get my recurring availability
// @route   GET /api/sparring/availability/recurring
// @access  Private (Professional only)
exports.getMyRecurringAvailability = async (req, res) => {
    try {
        const profile = await ProfessionalProfile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(200).json({ success: true, data: [] });
        }

        res.status(200).json({
            success: true,
            data: profile.availability
        });
    } catch (error) {
        console.error('Get Recurring Availability Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Remove recurring slot
// @route   DELETE /api/sparring/availability/recurring/:slotId
// @access  Private (Professional only)
exports.removeRecurringSlot = async (req, res) => {
    try {
        const profile = await ProfessionalProfile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        profile.availability = profile.availability.filter(slot => slot._id.toString() !== req.params.slotId);
        await profile.save();

        res.status(200).json({
            success: true,
            data: profile.availability
        });
    } catch (error) {
        console.error('Remove Recurring Slot Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get professional availability (Public)
// @route   GET /api/sparring/professionals/:id/availability
exports.getProAvailability = async (req, res) => {
    try {
        const profile = await ProfessionalProfile.findOne({ user: req.params.id });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Convert recurring slots to include computed dates (time only — no venue on pro availability)
        const slotsWithDates = profile.availability
            .filter(slot => slot.isActive)
            .map(slot => {
                const { court, venue, ...timeSlot } = slot.toObject();
                return {
                    ...timeSlot,
                    date: getNextOccurrence(slot.day),
                    matchFee: profile.matchFee
                };
            });

        res.status(200).json({
            success: true,
            data: slotsWithDates
        });
    } catch (error) {
        console.error('Get Pro Availability Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Create/Override single availability (Legacy Support)
exports.createAvailability = async (req, res) => {
    // Basic implementation for legacy support
    res.status(501).json({ error: 'Not implemented. Please use recurring slots.' });
};

// @desc    Update availability
exports.updateAvailability = async (req, res) => {
    res.status(501).json({ error: 'Not implemented. Please use recurring slots.' });
};

// @desc    Get my availability (Legacy Support)
exports.getMyAvailability = async (req, res) => {
    // Basic implementation for legacy support, redirecting or returning recurring?
    // For now, let's just return success with an empty array or implement as needed.
    res.status(501).json({ error: 'Not implemented. Please use recurring slots.' });
};

// @desc    Delete availability
exports.deleteAvailability = async (req, res) => {
    res.status(501).json({ error: 'Not implemented. Please use recurring slots.' });
};

// @desc    Toggle availability
exports.toggleAvailability = async (req, res) => {
    try {
        const profile = await ProfessionalProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        const slot = profile.availability.id(req.params.id);
        if (!slot) return res.status(404).json({ error: 'Slot not found' });

        slot.isActive = !slot.isActive;
        await profile.save();

        res.status(200).json({ success: true, data: profile.availability });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// =============================================================================
// BROWSING (Non-Professional Players)
// =============================================================================

// @desc    Get available professionals for a specific DATE and TIME
// @route   GET /api/sparring/available-pros
// @access  Public
exports.getAvailableProsForSlot = async (req, res) => {
    try {
        const { date, startTime, city, area } = req.query;
        const areaFilter = area || city;

        if (!date || !startTime) {
            return res.status(400).json({ error: 'Please provide date and startTime' });
        }

        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = days[queryDate.getDay()];

        // 1. Find Professionals with a recurring slot on this day/time
        // We look for profiles where availability.day matches and isActive is true
        // and startTime matches (assuming fixed 1-hour slots for simplicity or exact match)

        let proQuery = {
            isActive: true,
            'availability': {
                $elemMatch: {
                    day: dayOfWeek,
                    startTime: startTime,
                    isActive: true
                }
            }
        };

        const profiles = await ProfessionalProfile.find(proQuery)
            .populate('user', 'name email city area skillLevel rank profilePicture');

        const availablePros = [];

        for (const profile of profiles) {
            if (areaFilter && profile.user.area?.toLowerCase() !== normalizeArea(areaFilter).toLowerCase()) {
                continue;
            }

            const slot = profile.availability.find(s => s.day === dayOfWeek && s.startTime === startTime);

            // CHECK FOR CONFLICTING BOOKING
            const isBooked = await Booking.findOne({
                proPlayer: profile.user._id,
                date: queryDate,
                startTime: startTime,
                status: { $nin: ['cancelled', 'rejected'] }
            });

            if (!isBooked) {
                availablePros.push({
                    player: profile.user,
                    profileId: profile._id,
                    slot: slot,
                    matchFee: profile.matchFee,
                    isRecurring: true
                });
            }
        }

        // 2. Also Fetch Coaches (Recurring logic same as before)
        // Ignoring mixed coach logic here for brevity unless requested to merge.
        // The user specifically asked about "player, coach add his availability".
        // Coaches have CoachProfile. Let's merge them if needed, but for 'Sparring' purposes?
        // Assuming this endpoint is 'Sparring'. If it includes Coaches acting as sparring partners:

        const coaches = await CoachProfile.find({
            isActive: true,
            'availability': {
                $elemMatch: {
                    day: dayOfWeek,
                    startTime: startTime
                }
            }
        }).populate('user', 'name email city area skillLevel profilePicture');

        for (const coach of coaches) {
            if (areaFilter) {
                const normalized = normalizeArea(areaFilter).toLowerCase();
                const userArea = coach.user.area?.toLowerCase();
                const serviceAreas = (coach.location?.areas || []).map((value) => String(value).toLowerCase());
                if (userArea !== normalized && !serviceAreas.includes(normalized)) continue;
            }

            const isBooked = await Booking.findOne({
                proPlayer: coach.user._id, // Coaches are Users too
                date: queryDate,
                startTime: startTime,
                status: { $nin: ['cancelled', 'rejected'] }
            });

            if (!isBooked) {
                availablePros.push({
                    player: coach.user,
                    profileId: coach._id,
                    isMyCoach: true, // Marker
                    isRecurring: true
                });
            }
        }

        res.status(200).json({
            success: true,
            count: availablePros.length,
            data: availablePros
        });

    } catch (error) {
        console.error('Get Available Pros For Slot Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// =============================================================================
// SPARRING REQUESTS (Non-Professional to Professional)
// =============================================================================

// @desc    Send a sparring request for a GENERATED slot
// @route   POST /api/sparring/request/
// @access  Private (Non-Professional only)
exports.sendSparringRequest = async (req, res) => {
    try {
        const { proId, date, startTime: rawStart, endTime: rawEnd, courtId, message, availabilitySlotId } = req.body;
        const startTime = normalizeToHour(rawStart);
        const endTime = rawEnd ? normalizeToHour(rawEnd) : undefined;

        if (req.user.skillLevel === 'professional') {
            return res.status(403).json({ error: 'Professionals cannot send requests.' });
        }

        if (!proId || !date || !startTime || !courtId) {
            return res.status(400).json({ error: 'proId, date, startTime, and courtId are required' });
        }

        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);

        const profile = await ProfessionalProfile.findOne({ user: proId, isActive: true });
        if (!profile) {
            return res.status(404).json({ error: 'Professional profile not found' });
        }

        const dayOfWeek = WEEKDAYS[bookingDate.getDay()];
        const matchingSlot = profile.availability.find((slot) => {
            if (!slot.isActive || slot.day !== dayOfWeek || slot.startTime !== startTime) {
                return false;
            }
            if (availabilitySlotId) {
                return slot._id.toString() === availabilitySlotId;
            }
            return true;
        });

        if (!matchingSlot) {
            return res.status(400).json({ error: 'Professional is not available at the selected day and time' });
        }

        const resolvedEndTime = endTime || matchingSlot.endTime;

        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        const courtConflict = await Booking.findOne({
            court: courtId,
            date: bookingDate,
            startTime,
            status: { $nin: ['cancelled'] }
        });
        if (courtConflict) {
            return res.status(400).json({ error: 'This court is already booked for the selected time' });
        }

        const proConflict = await Booking.findOne({
            proPlayer: proId,
            date: bookingDate,
            startTime,
            status: { $nin: ['cancelled'] }
        });
        if (proConflict) {
            return res.status(400).json({ error: 'Professional is already booked for this time' });
        }

        const totalPrice = (court.pricePerHour || 0) + (profile.matchFee || 0);

        const booking = await Booking.create({
            user: req.user.id,
            proPlayer: proId,
            court: courtId,
            date: bookingDate,
            startTime,
            endTime: resolvedEndTime,
            totalPrice,
            status: 'pending_pro'
        });

        // Create notification request wrapper if needed, or just use Booking.
        // Existing flow used `SparringSessionRequest`. Let's create it for consistency with UI.

        const request = await SparringSessionRequest.create({
            requester: req.user.id,
            proPlayer: proId,
            booking: booking._id,
            message,
            status: 'PENDING_RESPONSE',
            responseDeadline: new Date(Date.now() + RESPONSE_DEADLINE_MS)
            // availabilitySlot omitted — venue lives on booking.court (chosen by requester)
        });

        // Link request to booking
        booking.sparringRequest = request._id;
        await booking.save();

        // Notify professional player that they received a new sparring request.
        try {
            await createNotification({
                userId: proId,
                type: 'booking',
                title: 'New Sparring Request',
                message: 'You have received a new sparring request. Please respond within 30 minutes.',
                meta: {
                    kind: 'incoming_sparring_request',
                    requestId: request._id,
                    bookingId: booking._id,
                    requesterId: req.user.id
                }
            });
        } catch (notifyErr) {
            console.error('Failed to create incoming sparring notification:', notifyErr);
        }

        await notifyIncomingRequest({
            recipientId: proId,
            requesterId: req.user.id,
            bookingId: booking._id,
            requestType: 'sparring'
        });

        res.status(201).json({
            success: true,
            data: request
        });

    } catch (error) {
        console.error('Send Request Error:', error);
        res.status(500).json({
            error: 'Server error',
            details: error.message,
            validationErrors: error.errors
        });
    }
};

// @desc    Get My Sent Requests (Non-Professional)
// @route   GET /api/sparring/requests/my
exports.getMySentRequests = async (req, res) => {
    try {
        const requests = await SparringSessionRequest.find({ requester: req.user.id })
            .populate('proPlayer', 'name email profilePicture')
            .populate({
                path: 'booking',
                populate: { path: 'court', select: 'name location' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Get My Sent Requests Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getNextOccurrence = (dayName) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayName.toLowerCase());
    if (targetDay === -1) return new Date();

    const now = new Date();
    const result = new Date(now);
    const currentDay = now.getDay();

    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;

    result.setDate(now.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
};

// @desc    Get all professionals with availability
// @route   GET /api/sparring/professionals
exports.getProfessionalsWithAvailability = async (req, res) => {
    try {
        const { city, area } = req.query;
        const areaFilter = area || city;
        let query = { isActive: true };

        // Find profiles that have at least one active availability slot
        const profiles = await ProfessionalProfile.find({
            ...query,
            'availability.isActive': true,
            'availability.0': { $exists: true }
        }).populate('user', 'name city area rank achievements skillLevel profilePicture');

        const formattedResults = profiles
            .filter(profile => {
                if (!areaFilter) return true;
                return profile.user?.area?.toLowerCase() === normalizeArea(areaFilter).toLowerCase();
            })
            .map(profile => ({
                player: profile.user,
                profile: profile,
                availableSlots: profile.availability
                    .filter(slot => slot.isActive)
                    .map(slot => {
                        const { court, venue, ...timeSlot } = slot.toObject();
                        return {
                            ...timeSlot,
                            date: getNextOccurrence(slot.day),
                            matchFee: profile.matchFee
                        };
                    })
            }));

        res.status(200).json({
            success: true,
            count: formattedResults.length,
            data: formattedResults
        });
    } catch (error) {
        console.error('Get Professionals With Availability Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get Incoming Requests (Professional)
// @route   GET /api/sparring/requests/incoming
exports.getIncomingRequests = async (req, res) => {
    try {
        // Fetch requests linked to bookings for me
        const requests = await SparringSessionRequest.find({ proPlayer: req.user.id })
            .populate('requester', 'name email skillLevel profilePicture')
            .populate({
                path: 'booking',
                populate: { path: 'court', select: 'name location' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Accept Request
exports.acceptRequest = async (req, res) => {
    try {
        const request = await SparringSessionRequest.findById(req.params.id).populate('booking');
        if (!request || request.proPlayer.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (request.status !== 'PENDING_RESPONSE') {
            return res.status(400).json({ error: 'Request is no longer pending' });
        }

        if (request.responseDeadline && new Date() > request.responseDeadline) {
            return res.status(400).json({ error: 'Response window has expired' });
        }

        request.status = 'ACCEPTED';
        request.respondedAt = new Date();
        await request.save();

        if (request.booking) {
            await Booking.findByIdAndUpdate(request.booking._id, { status: 'pending_payment' });
        }

        await notifySparringRequester(request, {
            title: 'Sparring Request Accepted',
            message: 'Your sparring request has been accepted. Please complete your booking payment.',
            status: 'ACCEPTED'
        });

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Reject Request
exports.rejectRequest = async (req, res) => {
    try {
        const request = await SparringSessionRequest.findById(req.params.id).populate('booking');
        if (!request || request.proPlayer.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        request.status = 'REJECTED';
        request.respondedAt = new Date();
        await request.save();

        if (request.booking) {
            await Booking.findByIdAndUpdate(request.booking._id, { status: 'cancelled' });
        }

        await notifySparringRequester(request, {
            title: 'Sparring Request Cancelled',
            message: 'Your sparring request was cancelled by the professional player.',
            status: 'REJECTED'
        });

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.notifySparringRequester = notifySparringRequester;
