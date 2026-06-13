const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const User = require('../models/User');
const { LAHORE_CITY, normalizeArea } = require('../constants/lahoreAreas');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getOrganizerArea = (user) => {
    if (user.area) return normalizeArea(user.area);
    if (user.city && user.city !== LAHORE_CITY) return normalizeArea(user.city);
    return '';
};

// @desc    Get all courts with filtering
// @route   GET /api/courts
// @access  Public
exports.getCourts = async (req, res, next) => {
    try {
        const { city, area, minPrice, maxPrice, surfaceType } = req.query;
        let query = { 'location.city': LAHORE_CITY };

        const areaFilter = String(area || '').trim();
        const legacyCityFilter = String(city || '').trim();
        const searchArea = areaFilter || (legacyCityFilter.toLowerCase() !== LAHORE_CITY.toLowerCase() ? legacyCityFilter : '');
        if (searchArea) {
            query['location.area'] = { $regex: `^${escapeRegex(searchArea)}`, $options: 'i' };
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
        const owner = await User.findById(req.user.id).select('area city role');
        if (!owner) {
            return res.status(404).json({ error: 'Organizer not found' });
        }

        const organizerArea = owner.role === 'organizer'
            ? getOrganizerArea(owner)
            : normalizeArea(req.body.location?.area || req.body.area || req.body.location?.city);

        if (owner.role === 'organizer' && !organizerArea) {
            return res.status(400).json({ error: 'Please complete your organizer profile region before creating a court.' });
        }

        const payload = {
            ...req.body,
            owner: req.user.id,
            location: {
                ...(req.body.location || {}),
                city: LAHORE_CITY,
                area: organizerArea
            }
        };

        const court = await Court.create(payload);

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

        const requester = await User.findById(req.user.id).select('area city role');
        if (!requester) {
            return res.status(404).json({ error: 'User not found' });
        }

        const nextArea = requester.role === 'organizer'
            ? getOrganizerArea(requester)
            : normalizeArea(payload.location?.area || payload.area || payload.location?.city || court.location?.area);

        if (requester.role === 'organizer' && !nextArea) {
            return res.status(400).json({ error: 'Please complete your organizer profile region before updating a court.' });
        }

        payload.location = {
            ...(court.location?.toObject?.() || court.location || {}),
            ...(payload.location || {}),
            city: LAHORE_CITY,
            area: nextArea
        };

        if (payload.area !== undefined) {
            delete payload.area;
        }

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

// @desc    Get court-owner dashboard overview
// @route   GET /api/courts/my/overview
// @access  Private (Organizer/Admin)
exports.getOwnerOverview = async (req, res, next) => {
    try {
        const courts = await Court.find({ owner: req.user.id })
            .select('name location pricePerHour openingTime closingTime')
            .sort({ createdAt: -1 });
        const courtIds = courts.map((court) => court._id);
        const bookings = await Booking.find({ court: { $in: courtIds } })
            .populate('court', 'name location')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        const tournaments = await Tournament.find({ court: { $in: courtIds } })
            .select('name court status startDate')
            .sort({ startDate: -1 });
        const tournamentIds = tournaments.map((tournament) => tournament._id);
        const registrations = await TournamentRegistration.find({ tournament: { $in: tournamentIds } })
            .populate('tournament', 'name court')
            .populate('player', 'name email')
            .populate('player1', 'name email')
            .populate('player2', 'name email')
            .sort({ registeredAt: -1 });

        const paidBookings = bookings.filter((booking) => booking.paymentStatus === 'paid');
        const pendingPayments = bookings.filter((booking) => booking.paymentStatus === 'pending');
        const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    courts: courts.length,
                    bookings: bookings.length,
                    confirmedBookings: confirmedBookings.length,
                    paidAmount: paidBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
                    pendingAmount: pendingPayments.reduce((sum, booking) => sum + booking.totalPrice, 0)
                },
                courts: courts.map((court) => {
                    const courtId = String(court._id);
                    const courtBookings = bookings.filter((booking) => String(booking.court?._id) === courtId);
                    const courtTournaments = tournaments.filter((tournament) => String(tournament.court) === courtId);
                    const courtTournamentIds = new Set(courtTournaments.map((tournament) => String(tournament._id)));
                    const courtRegistrations = registrations.filter((registration) =>
                        courtTournamentIds.has(String(registration.tournament?._id))
                    );
                    const paidCourtBookings = courtBookings.filter((booking) => booking.paymentStatus === 'paid');

                    return {
                        ...court.toObject(),
                        stats: {
                            bookings: courtBookings.length,
                            confirmedBookings: courtBookings.filter((booking) => booking.status === 'confirmed').length,
                            bookingRevenue: paidCourtBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
                            tournaments: courtTournaments.length,
                            registrations: courtRegistrations.length,
                            registrationRevenue: courtRegistrations
                                .filter((registration) => registration.paymentStatus === 'paid')
                                .reduce((sum, registration) => sum + registration.paymentAmount, 0)
                        }
                    };
                }),
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get one owner court with summary stats and activity logs
// @route   GET /api/courts/my/:id/details
// @access  Private (Organizer/Admin)
exports.getOwnerCourtDetails = async (req, res, next) => {
    try {
        const court = await Court.findOne({ _id: req.params.id, owner: req.user.id });
        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        const bookings = await Booking.find({ court: court._id })
            .populate('user', 'name email profilePicture')
            .populate('proPlayer', 'name email profilePicture')
            .sort({ date: -1, startTime: -1 });

        const tournaments = await Tournament.find({ court: court._id })
            .select('name status startDate endDate categories')
            .sort({ startDate: -1 });

        const tournamentIds = tournaments.map((tournament) => tournament._id);
        const registrations = await TournamentRegistration.find({ tournament: { $in: tournamentIds } })
            .populate('tournament', 'name court')
            .populate('player', 'name email profilePicture')
            .populate('player1', 'name email profilePicture')
            .populate('player2', 'name email profilePicture')
            .sort({ registeredAt: -1 });

        const paidBookings = bookings.filter((booking) => booking.paymentStatus === 'paid');
        const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');
        const paidRegistrations = registrations.filter((registration) => registration.paymentStatus === 'paid');

        res.status(200).json({
            success: true,
            data: {
                court,
                stats: {
                    bookings: bookings.length,
                    confirmedBookings: confirmedBookings.length,
                    bookingRevenue: paidBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0),
                    pendingAmount: bookings
                        .filter((booking) => booking.paymentStatus === 'pending')
                        .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0),
                    tournaments: tournaments.length,
                    registrations: registrations.length,
                    registrationRevenue: paidRegistrations.reduce((sum, registration) => sum + (registration.paymentAmount || 0), 0)
                },
                bookings,
                tournaments,
                registrations
            }
        });
    } catch (error) {
        next(error);
    }
};
