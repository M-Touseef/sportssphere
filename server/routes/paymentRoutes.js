const express = require('express');
const router = express.Router();

const {
    initiatePayment,
    handleReturn,
    handleIPN,
    getPaymentStatus
} = require('../controllers/paymentController');

const { auth } = require('../middleware/auth');

// Initiate payment — requires logged-in user
router.post('/initiate', auth, initiatePayment);

// Return URL — no auth (JazzCash browser redirect)
router.post('/return', handleReturn);

// IPN URL — no auth (JazzCash server-to-server callback)
router.post('/ipn', handleIPN);

// Query transaction status — requires logged-in user
router.get('/status/:txnRefNo', auth, getPaymentStatus);

module.exports = router;
