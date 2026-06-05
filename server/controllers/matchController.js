const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const Match = require('../models/Match');
const { validateBadmintonMatchScore } = require('../utils/badmintonScoring');

// @desc    Generate draws for a tournament category
// @route   POST /api/tournaments/:id/generate-brackets
// @access  Private (Organizer)
exports.generateBrackets = async (req, res) => {
    try {
        const { category } = req.body;
        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Check authorization
        if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ error: 'Not authorized' });
        }

        // Get all confirmed registrations for the category
        const registrations = await TournamentRegistration.find({
            tournament: tournament._id,
            category,
            status: 'confirmed'
        }).sort({ seedNumber: 1, registeredAt: 1 });

        if (registrations.length < 2) {
            return res.status(400).json({ error: 'Not enough participants to generate draws' });
        }

        // Check if draws already exist
        const existingMatches = await Match.countDocuments({
            tournament: tournament._id,
            category
        });

        if (existingMatches > 0) {
            return res.status(400).json({ error: 'Draws already generated for this category' });
        }

        // Generate single elimination draw
        const matches = await generateSingleEliminationBracket(
            tournament._id,
            category,
            registrations
        );

        res.status(201).json({
            success: true,
            count: matches.length,
            data: matches
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Helper function to generate single elimination bracket
async function generateSingleEliminationBracket(tournamentId, category, registrations) {
    const numParticipants = registrations.length;

    // Find next power of 2
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
    const numByes = bracketSize - numParticipants;

    // Determine rounds
    const rounds = [];
    let currentRound = bracketSize;

    while (currentRound >= 2) {
        if (currentRound === 2) rounds.push('final');
        else if (currentRound === 4) rounds.push('semi_final');
        else if (currentRound === 8) rounds.push('quarter_final');
        else if (currentRound === 16) rounds.push('round_of_16');
        else if (currentRound === 32) rounds.push('round_of_32');
        else if (currentRound === 64) rounds.push('round_of_64');
        else rounds.push(`round_${Math.log2(currentRound)}`);
        currentRound /= 2;
    }
    // rounds.reverse(); // Incorrect to reverse: ['quarter_final', 'semi_final', 'final'] is correct order for standard generation?
    // Wait, let's trace:
    // rounds = ['quarter_final', 'semi_final', 'final']
    // rounds[0] = 'quarter_final'.
    // Logic creates matches for rounds[0] using registrations.
    // This is correct.

    // Removing reverse.

    // Create first round matches
    const firstRoundMatches = [];
    let matchNumber = 1;
    let regIndex = 0;

    for (let i = 0; i < bracketSize / 2; i++) {
        const match = {
            tournament: tournamentId,
            category,
            round: rounds[0],
            matchNumber: matchNumber++,
            participant1: {},
            participant2: {},
            status: 'scheduled'
        };

        // Assign participants (handle byes)
        if (regIndex < registrations.length) {
            match.participant1.registration = registrations[regIndex++]._id;
        }

        if (regIndex < registrations.length) {
            match.participant2.registration = registrations[regIndex++]._id;
        }

        // If only one participant, it's a bye (automatic win)
        if (!match.participant2.registration) {
            match.status = 'walkover';
            match.participant1.isWinner = true;
            match.winner = match.participant1.registration;
        }

        firstRoundMatches.push(match);
    }

    // Create all matches
    const allMatches = await Match.create(firstRoundMatches);

    // Create subsequent rounds and link matches
    let previousRoundMatches = allMatches;

    for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
        const currentRoundMatches = [];
        matchNumber = 1;

        for (let i = 0; i < previousRoundMatches.length; i += 2) {
            const match = await Match.create({
                tournament: tournamentId,
                category,
                round: rounds[roundIndex],
                matchNumber: matchNumber++,
                participant1: {},
                participant2: {},
                status: 'scheduled'
            });

            // Link previous matches to this match
            if (previousRoundMatches[i]) {
                previousRoundMatches[i].nextMatchId = match._id;
                previousRoundMatches[i].nextMatchPosition = 'participant1';
                await previousRoundMatches[i].save();
            }

            if (previousRoundMatches[i + 1]) {
                previousRoundMatches[i + 1].nextMatchId = match._id;
                previousRoundMatches[i + 1].nextMatchPosition = 'participant2';
                await previousRoundMatches[i + 1].save();
            }

            currentRoundMatches.push(match);
        }

        previousRoundMatches = currentRoundMatches;
    }

    // Return all matches
    return await Match.find({ tournament: tournamentId, category })
        .populate('participant1.registration')
        .populate('participant2.registration');
}

// @desc    Get tournament matches
// @route   GET /api/tournaments/:id/matches
// @access  Public
exports.getTournamentMatches = async (req, res) => {
    try {
        const { category, round, status } = req.query;
        let query = { tournament: req.params.id };

        if (category) query.category = category;
        if (round) query.round = round;
        if (status) query.status = status;

        const matches = await Match.find(query)
            .populate({
                path: 'participant1.registration',
                populate: [
                    { path: 'player', select: 'name email profilePicture' },
                    { path: 'player1', select: 'name email profilePicture' },
                    { path: 'player2', select: 'name email profilePicture' }
                ]
            })
            .populate({
                path: 'participant2.registration',
                populate: [
                    { path: 'player', select: 'name email profilePicture' },
                    { path: 'player1', select: 'name email profilePicture' },
                    { path: 'player2', select: 'name email profilePicture' }
                ]
            })
            .populate('referee', 'name email')
            .sort({ round: 1, matchNumber: 1 });

        res.status(200).json({
            success: true,
            count: matches.length,
            data: matches
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Submit match result
// @route   PUT /api/matches/:id/result
// @access  Private (Organizer or Referee)
exports.submitMatchResult = async (req, res) => {
    try {
        const { participant1Score, participant2Score } = req.body;
        const match = await Match.findById(req.params.id)
            .populate('tournament');

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Check authorization
        const isAuthorized = match.tournament.organizer.toString() === req.user.id ||
            match.referee?.toString() === req.user.id ||
            req.user.role === 'admin';

        if (!isAuthorized) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        if (!match.participant1.registration || !match.participant2.registration) {
            return res.status(400).json({ error: 'Both participants are required before submitting a result' });
        }

        const scoreResult = validateBadmintonMatchScore(participant1Score, participant2Score);
        if (scoreResult.error) {
            return res.status(400).json({ error: scoreResult.error });
        }

        // Update match scores
        match.participant1.score = scoreResult.participant1Score;
        match.participant2.score = scoreResult.participant2Score;

        // Calculate winner
        const winnerId = scoreResult.matchWinner === 'participant1'
            ? match.participant1.registration
            : match.participant2.registration;

        match.winner = winnerId;
        match.participant1.isWinner = winnerId.toString() === match.participant1.registration.toString();
        match.participant2.isWinner = winnerId.toString() === match.participant2.registration.toString();
        match.status = 'completed';
        match.completedAt = new Date();

        await match.save();

        // Progress winner to next match
        if (match.nextMatchId) {
            const nextMatch = await Match.findById(match.nextMatchId);
            if (nextMatch) {
                if (match.nextMatchPosition === 'participant1') {
                    nextMatch.participant1.registration = winnerId;
                } else {
                    nextMatch.participant2.registration = winnerId;
                }
                await nextMatch.save();
            }
        }

        const updatedMatch = await Match.findById(match._id)
            .populate({
                path: 'participant1.registration',
                populate: [
                    { path: 'player', select: 'name email profilePicture' },
                    { path: 'player1', select: 'name email profilePicture' },
                    { path: 'player2', select: 'name email profilePicture' }
                ]
            })
            .populate({
                path: 'participant2.registration',
                populate: [
                    { path: 'player', select: 'name email profilePicture' },
                    { path: 'player1', select: 'name email profilePicture' },
                    { path: 'player2', select: 'name email profilePicture' }
                ]
            });

        res.status(200).json({
            success: true,
            data: updatedMatch
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get leaderboard for a tournament category
// @route   GET /api/tournaments/:id/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
    try {
        const { category } = req.query;

        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }

        // Get all matches for the category
        const matches = await Match.find({
            tournament: req.params.id,
            category,
            status: 'completed'
        }).populate('participant1.registration participant2.registration');

        // Calculate standings
        const standings = {};

        matches.forEach(match => {
            const p1Id = match.participant1.registration?._id.toString();
            const p2Id = match.participant2.registration?._id.toString();

            if (p1Id) {
                if (!standings[p1Id]) {
                    standings[p1Id] = {
                        registration: match.participant1.registration,
                        wins: 0,
                        losses: 0,
                        setsWon: 0,
                        setsLost: 0,
                        pointsWon: 0,
                        pointsLost: 0
                    };
                }

                const p1Sets = match.participant1.score.reduce((sum, score, idx) => {
                    return sum + (score > match.participant2.score[idx] ? 1 : 0);
                }, 0);
                const p2Sets = match.participant2.score.reduce((sum, score, idx) => {
                    return sum + (score > match.participant1.score[idx] ? 1 : 0);
                }, 0);

                standings[p1Id].setsWon += p1Sets;
                standings[p1Id].setsLost += p2Sets;
                standings[p1Id].pointsWon += match.participant1.score.reduce((a, b) => a + b, 0);
                standings[p1Id].pointsLost += match.participant2.score.reduce((a, b) => a + b, 0);

                if (match.participant1.isWinner) {
                    standings[p1Id].wins++;
                } else {
                    standings[p1Id].losses++;
                }
            }

            if (p2Id) {
                if (!standings[p2Id]) {
                    standings[p2Id] = {
                        registration: match.participant2.registration,
                        wins: 0,
                        losses: 0,
                        setsWon: 0,
                        setsLost: 0,
                        pointsWon: 0,
                        pointsLost: 0
                    };
                }

                const p1Sets = match.participant1.score.reduce((sum, score, idx) => {
                    return sum + (score > match.participant2.score[idx] ? 1 : 0);
                }, 0);
                const p2Sets = match.participant2.score.reduce((sum, score, idx) => {
                    return sum + (score > match.participant1.score[idx] ? 1 : 0);
                }, 0);

                standings[p2Id].setsWon += p2Sets;
                standings[p2Id].setsLost += p1Sets;
                standings[p2Id].pointsWon += match.participant2.score.reduce((a, b) => a + b, 0);
                standings[p2Id].pointsLost += match.participant1.score.reduce((a, b) => a + b, 0);

                if (match.participant2.isWinner) {
                    standings[p2Id].wins++;
                } else {
                    standings[p2Id].losses++;
                }
            }
        });

        // Convert to array and sort
        const leaderboard = Object.values(standings)
            .sort((a, b) => {
                // Sort by wins, then by sets won, then by points won
                if (b.wins !== a.wins) return b.wins - a.wins;
                if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
                return b.pointsWon - a.pointsWon;
            })
            .map((entry, index) => ({
                rank: index + 1,
                ...entry
            }));

        // Populate registration details
        await TournamentRegistration.populate(leaderboard, {
            path: 'registration',
            populate: [
                { path: 'player', select: 'name email skillLevel profilePicture' },
                { path: 'player1', select: 'name email skillLevel profilePicture' },
                { path: 'player2', select: 'name email skillLevel profilePicture' }
            ]
        });

        res.status(200).json({
            success: true,
            count: leaderboard.length,
            data: leaderboard
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
