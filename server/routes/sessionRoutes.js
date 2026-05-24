const express = require('express');
const router = express.Router();
const {
    publishSession,
    getAvailableSessions,
    requestSession,
    bookSession,
    getMySessions,
    getCoachSessions,
    cancelSession,
    confirmSession,
    rejectSession,
    getCoachRealizedAvailability,
    requestRecurringSession,
    payCourtFee
} = require('../controllers/sessionController');
const { auth, authorize, optionalAuth } = require('../middleware/auth');

router.post('/publish', auth, authorize('coach'), publishSession);
router.get('/available/:coachId', getAvailableSessions);
router.get('/available/recurring/:coachId', optionalAuth, getCoachRealizedAvailability);
router.post('/request/recurring', auth, requestRecurringSession);
router.put('/:id/pay-court-fee', auth, authorize('coach'), payCourtFee);
router.post('/:id/request', auth, requestSession);
router.post('/', auth, bookSession); // Keep for legacy if needed
router.get('/my', auth, getMySessions);
router.get('/coach', auth, authorize('coach'), getCoachSessions);
router.put('/:id/cancel', auth, cancelSession);
router.put('/:id/confirm', auth, authorize('coach'), confirmSession);
router.put('/:id/reject', auth, authorize('coach'), rejectSession);

module.exports = router;
