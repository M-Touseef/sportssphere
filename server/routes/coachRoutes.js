const express = require('express');
const router = express.Router();
const {
    createOrUpdateProfile,
    getCoaches,
    getCoachProfile,
    getMyProfile,
    getCoachAvailability,
    addAvailabilitySlot,
    updateAvailabilitySlot,
    removeAvailabilitySlot
} = require('../controllers/coachController');
const {
    createCoachCourtBooking,
    getCoachCourtBookings,
    cancelCoachCourtBooking
} = require('../controllers/coachCourtBookingController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', getCoaches);
router.get('/me', auth, authorize('coach'), getMyProfile);
router.get('/court-bookings', auth, authorize('coach'), getCoachCourtBookings);
router.post('/court-bookings', auth, authorize('coach'), createCoachCourtBooking);
router.put('/court-bookings/:id/cancel', auth, authorize('coach'), cancelCoachCourtBooking);
router.get('/:id/availability', getCoachAvailability);
router.post('/availability', auth, authorize('coach'), addAvailabilitySlot);
router.put('/availability/:slotId', auth, authorize('coach'), updateAvailabilitySlot);
router.delete('/availability/:slotId', auth, authorize('coach'), removeAvailabilitySlot);

router.route('/:id')
    .get(getCoachProfile);
router.post('/profile', auth, authorize('coach'), createOrUpdateProfile);

module.exports = router;
