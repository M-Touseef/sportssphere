const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const Match = require('../models/Match');
const Court = require('../models/Court');

const TOURNAMENT_GRADES = ['division', 'national', 'international'];

const normalizeContactPhone = (phone) => {
    if (phone == null || phone === '') return phone;
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length !== 11) {
        const err = new Error('Contact phone must be exactly 11 digits');
        err.statusCode = 400;
        throw err;
    }
    return digits;
};

const validateCategoryGrades = (categories) => {
    if (!Array.isArray(categories)) return;
    for (const cat of categories) {
        if (cat.skillLevel && !TOURNAMENT_GRADES.includes(cat.skillLevel)) {
            const err = new Error(
                `Invalid tactical grade. Must be one of: ${TOURNAMENT_GRADES.join(', ')}`
            );
            err.statusCode = 400;
            throw err;
        }
    }
};

// @desc    Create a new tournament
// @route   POST /api/tournaments
// @access  Private (Organizer only)
exports.createTournament = async (req, res, next) => {
    try {
        const { court: courtId } = req.body;

        if (!courtId) {
            return res.status(400).json({ error: 'Court ID is required' });
        }

        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        // Check if user is the court owner
        if (court.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Only the court owner can create a tournament for this venue.'
            });
        }

        validateCategoryGrades(req.body.categories);
        const contactPhone = normalizeContactPhone(req.body.contactPhone);

        const tournamentData = {
            ...req.body,
            contactPhone,
            organizer: req.user.id,
            venue: court.name, // Auto-fill venue name from court
            city: court.location.city // Auto-fill city from court
        };

        const tournament = await Tournament.create(tournamentData);

        res.status(201).json({
            success: true,
            data: tournament
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Public
exports.getTournaments = async (req, res, next) => {
    try {
        const { city, status, category, upcoming } = req.query;
        let query = { isPublished: true };

        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }

        if (status) {
            query.status = status;
        }

        if (category) {
            query['categories.name'] = category;
        }

        // Upcoming-only applies when not filtering by a specific status (completed/in_progress need past events)
        if (upcoming === 'true' && !status) {
            query.startDate = { $gte: new Date() };
        }

        const tournaments = await Tournament.find(query)
            .populate('organizer', 'name email')
            .sort({ startDate: 1 });

        res.status(200).json({
            success: true,
            count: tournaments.length,
            data: tournaments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single tournament
// @route   GET /api/tournaments/:id
// @access  Public
exports.getTournament = async (req, res, next) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('organizer', 'name email phone');

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Get registration counts for each category
        const registrationCounts = await TournamentRegistration.aggregate([
            { $match: { tournament: tournament._id, status: 'confirmed' } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const tournamentData = tournament.toObject();
        tournamentData.registrationCounts = registrationCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        // Check if the requesting user is already registered
        if (req.user) {
            const userRegistration = await TournamentRegistration.findOne({
                tournament: tournament._id,
                status: 'confirmed',
                $or: [
                    { player: req.user.id },
                    { player1: req.user.id },
                    { player2: req.user.id }
                ]
            });
            tournamentData.userRegistration = userRegistration;
        } else {
            tournamentData.userRegistration = null;
        }

        res.status(200).json({
            success: true,
            data: tournamentData
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update tournament
// @route   PUT /api/tournaments/:id
// @access  Private (Organizer who created it)
exports.updateTournament = async (req, res, next) => {
    try {
        let tournament = await Tournament.findById(req.params.id);

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Check authorization
        if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ error: 'Not authorized' });
        }

        validateCategoryGrades(req.body.categories);
        const updates = { ...req.body };
        if (updates.contactPhone !== undefined) {
            updates.contactPhone = normalizeContactPhone(updates.contactPhone);
        }

        tournament = await Tournament.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: tournament
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete tournament
// @route   DELETE /api/tournaments/:id
// @access  Private (Organizer who created it or Admin)
exports.deleteTournament = async (req, res, next) => {
    try {
        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Check authorization
        if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ error: 'Not authorized' });
        }

        // Don't allow deletion if tournament has started
        if (tournament.status === 'in_progress' || tournament.status === 'completed') {
            return res.status(400).json({ error: 'Cannot delete tournament that has started or completed' });
        }

        await tournament.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Publish tournament
// @route   PUT /api/tournaments/:id/publish
// @access  Private (Organizer who created it)
exports.publishTournament = async (req, res, next) => {
    try {
        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Check authorization
        if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ error: 'Not authorized' });
        }

        tournament.isPublished = true;
        tournament.status = 'registration_open';
        await tournament.save();

        res.status(200).json({
            success: true,
            data: tournament
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get my tournaments (as organizer)
// @route   GET /api/tournaments/my/organized
// @access  Private (Organizer)
exports.getMyTournaments = async (req, res, next) => {
    try {
        const tournaments = await Tournament.find({ organizer: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tournaments.length,
            data: tournaments
        });
    } catch (error) {
        next(error);
    }
};
