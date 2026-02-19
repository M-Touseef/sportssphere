const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, cancelBooking, confirmPayment } = require('../controllers/bookingController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createBooking);
router.get('/my', auth, getMyBookings);
router.put('/:id/cancel', auth, cancelBooking);
router.put('/:id/pay', auth, confirmPayment);

module.exports = router;
