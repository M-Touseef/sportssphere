const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const {
    generateTxnRefNo,
    verifySecureHash,
    buildPaymentParams
} = require('../services/jazzcashService');

// ─── POST /api/payment/initiate ───────────────────────────────────────────────
// @desc    Initiate a JazzCash payment for a pending booking
// @access  Private (auth required)
exports.initiatePayment = async (req, res, next) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({ error: 'bookingId is required' });
        }

        // 1. Find and validate the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized for this booking' });
        }
        if (booking.status !== 'pending_payment') {
            return res.status(400).json({
                error: `Booking is not awaiting payment (current status: ${booking.status})`
            });
        }

        // 2. Generate unique transaction reference
        const txnRefNo = generateTxnRefNo();

        // 3. Create a Transaction record (status = pending)
        const transaction = await Transaction.create({
            orderId: booking._id,
            userId: req.user.id,
            txnRefNo,
            amount: booking.totalPrice,
            status: 'pending'
        });

        // 4. Save txnRefNo onto booking for easy lookup later
        booking.txnRefNo = txnRefNo;
        await booking.save();

        // 5. Build JazzCash payment parameters + secure hash
        const description = `Booking-${booking._id}`;
        const { params, paymentUrl } = buildPaymentParams({
            amount: booking.totalPrice,
            txnRefNo,
            description
        });

        console.log(`[Payment] Initiated txnRefNo=${txnRefNo} for booking=${bookingId}`);

        return res.status(200).json({
            success: true,
            txnRefNo,
            transactionId: transaction._id,
            paymentUrl,
            params
        });
    } catch (error) {
        console.error('[Payment] initiatePayment error:', error);
        next(error);
    }
};

// ─── POST /api/payment/return ─────────────────────────────────────────────────
// @desc    Handle JazzCash browser redirect (user-facing return)
// @access  Public (browser redirect from JazzCash, no JWT)
exports.handleReturn = async (req, res, next) => {
    try {
        const payload = req.body;
        console.log('[Payment] Return URL received:', payload);

        const salt = process.env.JAZZ_INTEGRITY_SALT;
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const responseCode = payload.pp_ResponseCode || 'unknown';
        const txnRefNo = payload.pp_TxnRefNo || '';

        // Verify hash to ensure payload wasn't tampered with
        const hashValid = verifySecureHash(payload, salt);

        if (!hashValid) {
            console.warn('[Payment] Return URL: invalid SecureHash, possible tampering');
            return res.redirect(
                `${clientUrl}/payment/return?status=error&message=invalid_hash&txnRef=${txnRefNo}`
            );
        }

        // Redirect user to frontend with status info
        // Do NOT finalize payment here — IPN is authoritative
        const status = responseCode === '000' ? 'success' : 'failed';
        const redirectUrl = `${clientUrl}/payment/return?status=${status}&code=${responseCode}&txnRef=${encodeURIComponent(txnRefNo)}&message=${encodeURIComponent(payload.pp_ResponseMessage || '')}`;

        return res.redirect(redirectUrl);
    } catch (error) {
        console.error('[Payment] handleReturn error:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientUrl}/payment/return?status=error&message=server_error`);
    }
};

// ─── POST /api/payment/ipn ────────────────────────────────────────────────────
// @desc    JazzCash Instant Payment Notification (server-to-server, authoritative)
// @access  Public (called by JazzCash servers, no JWT)
exports.handleIPN = async (req, res, next) => {
    try {
        const payload = req.body;
        console.log('[Payment] IPN received:', JSON.stringify(payload, null, 2));

        const salt = process.env.JAZZ_INTEGRITY_SALT;
        const merchantId = process.env.JAZZ_MERCHANT_ID;

        // 1. Verify secure hash
        const hashValid = verifySecureHash(payload, salt);
        if (!hashValid) {
            console.error('[Payment] IPN: invalid SecureHash — rejecting');
            // Still return 200 to prevent JazzCash from retrying forever
            return res.status(200).json({ status: 'hash_mismatch' });
        }

        // 2. Validate merchant ID
        if (payload.pp_MerchantID !== merchantId) {
            console.error('[Payment] IPN: merchant ID mismatch');
            return res.status(200).json({ status: 'merchant_mismatch' });
        }

        const txnRefNo = payload.pp_TxnRefNo;
        const responseCode = payload.pp_ResponseCode;
        const jazzcashTxnId = payload.pp_TxnRefNo; // JazzCash's own ref

        // 3. Find transaction by txnRefNo
        const transaction = await Transaction.findOne({ txnRefNo });
        if (!transaction) {
            console.error(`[Payment] IPN: no Transaction found for txnRefNo=${txnRefNo}`);
            return res.status(200).json({ status: 'not_found' });
        }

        // 4. Idempotency guard — already processed
        if (transaction.status === 'paid' || transaction.status === 'failed') {
            console.log(`[Payment] IPN: already processed (status=${transaction.status}), skipping`);
            return res.status(200).json({ status: 'already_processed' });
        }

        // 5. Validate amount (JazzCash sends paise; we stored PKR)
        const receivedAmountPaisa = parseInt(payload.pp_Amount, 10);
        const expectedAmountPaisa = Math.round(transaction.amount * 100);
        if (receivedAmountPaisa !== expectedAmountPaisa) {
            console.error(
                `[Payment] IPN: amount mismatch — expected ${expectedAmountPaisa} paisa, got ${receivedAmountPaisa} paisa`
            );
            transaction.status = 'failed';
            transaction.ipnPayload = payload;
            await transaction.save();
            return res.status(200).json({ status: 'amount_mismatch' });
        }

        // 6. Process outcome
        const booking = await Booking.findById(transaction.orderId);

        if (responseCode === '000') {
            // SUCCESS
            transaction.status = 'paid';
            transaction.jazzcashTxnId = jazzcashTxnId;
            transaction.ipnPayload = payload;
            await transaction.save();

            if (booking) {
                booking.paymentStatus = 'paid';
                booking.status = 'confirmed';
                booking.jazzcashTxnId = jazzcashTxnId;
                await booking.save();
                console.log(`[Payment] IPN: PAID — booking=${booking._id} confirmed`);
            }
        } else {
            // FAILURE
            transaction.status = 'failed';
            transaction.ipnPayload = payload;
            await transaction.save();

            if (booking) {
                // Keep booking in pending_payment so user can retry
                console.log(
                    `[Payment] IPN: FAILED (code=${responseCode}) — booking=${booking._id} unchanged`
                );
            }
        }

        // Always respond 200 — JazzCash retries on non-200
        return res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('[Payment] handleIPN error:', error);
        // Still respond 200 to prevent infinite retries
        return res.status(200).json({ status: 'server_error' });
    }
};

// ─── GET /api/payment/status/:txnRefNo ────────────────────────────────────────
// @desc    Query transaction status (for frontend polling / debugging)
// @access  Private (auth required)
exports.getPaymentStatus = async (req, res, next) => {
    try {
        const { txnRefNo } = req.params;

        const transaction = await Transaction.findOne({ txnRefNo }).populate('orderId', 'status paymentStatus totalPrice');
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Only allow the owner to query
        if (transaction.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        return res.status(200).json({
            success: true,
            data: {
                txnRefNo: transaction.txnRefNo,
                status: transaction.status,
                amount: transaction.amount,
                jazzcashTxnId: transaction.jazzcashTxnId,
                createdAt: transaction.createdAt,
                booking: transaction.orderId
            }
        });
    } catch (error) {
        console.error('[Payment] getPaymentStatus error:', error);
        next(error);
    }
};
