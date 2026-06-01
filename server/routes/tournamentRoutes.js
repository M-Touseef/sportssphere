const express = require('express');
const router = express.Router();
const {
    createTournament,
    getTournaments,
    getTournament,
    updateTournament,
    deleteTournament,
    publishTournament,
    getMyTournaments
} = require('../controllers/tournamentController');
const {
    registerForTournament,
    getTournamentRegistrations,
    getMyRegistrations,
    withdrawRegistration
} = require('../controllers/registrationController');
const {
    generateBrackets,
    getTournamentMatches,
    submitMatchResult,
    getLeaderboard
} = require('../controllers/matchController');
const { auth, optionalAuth, authorize } = require('../middleware/auth');

// Tournament routes
router.get('/', optionalAuth, getTournaments);
router.get('/my/organized', auth, authorize('admin', 'organizer'), getMyTournaments);
router.get('/my/registrations', auth, getMyRegistrations);
router.get('/:id', optionalAuth, getTournament);
router.post('/', auth, authorize('admin', 'organizer'), createTournament);
router.put('/:id', auth, authorize('admin', 'organizer'), updateTournament);
router.delete('/:id', auth, authorize('admin', 'organizer'), deleteTournament);
router.put('/:id/publish', auth, authorize('admin', 'organizer'), publishTournament);

// Registration routes
router.post('/:id/register', auth, registerForTournament);
router.get('/:id/registrations', getTournamentRegistrations);

// Match and bracket routes
router.post('/:id/generate-brackets', auth, authorize('admin', 'organizer'), generateBrackets);
router.get('/:id/matches', getTournamentMatches);
router.get('/:id/leaderboard', getLeaderboard);

// Registration withdrawal
router.put('/registrations/:id/withdraw', auth, withdrawRegistration);

module.exports = router;
