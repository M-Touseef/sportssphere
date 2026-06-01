const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Register for a tournament
// @route   POST /api/tournaments/:id/register
// @access  Private
exports.registerForTournament = async (req, res) => {
    try {
        const { category, player2Id, teamName } = req.body;

        if (req.user.role !== 'player') {
            return res.status(403).json({
                error: 'Only player accounts can register for tournaments. Organizers manage events from their dashboard.'
            });
        }

        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Check if registration is open
        if (tournament.status !== 'registration_open') {
            return res.status(400).json({ error: 'Registration is not open for this tournament' });
        }

        // Check if deadline has passed
        if (new Date() > tournament.registrationDeadline) {
            return res.status(400).json({ error: 'Registration deadline has passed' });
        }

        // Find category details
        const categoryDetails = tournament.categories.find(cat => cat.name === category);
        if (!categoryDetails) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        // Check if category is full
        const currentRegistrations = await TournamentRegistration.countDocuments({
            tournament: tournament._id,
            category,
            status: 'confirmed'
        });

        if (currentRegistrations >= categoryDetails.maxParticipants) {
            return res.status(400).json({ error: 'Category is full' });
        }

        // Check if already registered
        const existingRegistration = await TournamentRegistration.findOne({
            tournament: tournament._id,
            category,
            status: { $nin: ['withdrawn', 'disqualified'] },
            $or: [
                { player: req.user.id },
                { player1: req.user.id },
                { player2: req.user.id }
            ]
        });

        if (existingRegistration) {
            return res.status(400).json({ error: 'Already registered/pending for this category' });
        }

        // Create registration
        const registrationData = {
            tournament: tournament._id,
            category,
            paymentAmount: categoryDetails.entryFee,
            status: 'pending', // Awaiting payment
            paymentStatus: 'pending'
        };

        // Handle singles vs doubles
        const isDoubles = category.includes('doubles');
        if (isDoubles) {
            if (!player2Id) {
                return res.status(400).json({ error: 'Partner required for doubles category' });
            }

            if (player2Id === req.user.id) {
                return res.status(400).json({ error: 'You cannot select yourself as your doubles partner' });
            }

            if (!mongoose.isValidObjectId(player2Id)) {
                return res.status(400).json({ error: 'Invalid doubles partner ID' });
            }

            const partner = await User.findById(player2Id).select('role');
            if (!partner) {
                return res.status(404).json({ error: 'Doubles partner not found' });
            }
            if (partner.role !== 'player') {
                return res.status(400).json({
                    error: 'Doubles partner must be a player account. Organizers cannot register for tournaments.'
                });
            }

            registrationData.player1 = req.user.id;
            registrationData.player2 = player2Id;
            registrationData.teamName = teamName || `${req.user.name} & Partner`;
        } else {
            registrationData.player = req.user.id;
        }

        const registration = await TournamentRegistration.create(registrationData);

        const populatedRegistration = await TournamentRegistration.findById(registration._id)
            .populate('player', 'name email')
            .populate('player1', 'name email')
            .populate('player2', 'name email')
            .populate('tournament', 'name startDate');

        res.status(201).json({
            success: true,
            data: populatedRegistration
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get tournament registrations
// @route   GET /api/tournaments/:id/registrations
// @access  Public
exports.getTournamentRegistrations = async (req, res) => {
    try {
        const { category } = req.query;
        let query = { tournament: req.params.id, status: 'confirmed' };

        if (category) {
            query.category = category;
        }

        const registrations = await TournamentRegistration.find(query)
            .populate('player', 'name email skillLevel')
            .populate('player1', 'name email skillLevel')
            .populate('player2', 'name email skillLevel')
            .sort({ registeredAt: 1 });

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get my tournament registrations
// @route   GET /api/tournaments/my/registrations
// @access  Private
exports.getMyRegistrations = async (req, res) => {
    try {
        const registrations = await TournamentRegistration.find({
            $or: [
                { player: req.user.id },
                { player1: req.user.id },
                { player2: req.user.id }
            ]
        })
            .populate('tournament', 'name startDate endDate venue city status')
            .populate('player', 'name email')
            .populate('player1', 'name email')
            .populate('player2', 'name email')
            .sort({ registeredAt: -1 });

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Withdraw from tournament
// @route   PUT /api/tournaments/registrations/:id/withdraw
// @access  Private
exports.withdrawRegistration = async (req, res) => {
    try {
        const registration = await TournamentRegistration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        // Check authorization
        const isAuthorized = registration.player?.toString() === req.user.id ||
            registration.player1?.toString() === req.user.id ||
            registration.player2?.toString() === req.user.id;

        if (!isAuthorized) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        // Check if tournament has started
        const tournament = await Tournament.findById(registration.tournament);
        if (tournament.status === 'in_progress' || tournament.status === 'completed') {
            return res.status(400).json({ error: 'Cannot withdraw from tournament that has started' });
        }

        registration.status = 'withdrawn';
        await registration.save();

        res.status(200).json({
            success: true,
            data: registration
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
