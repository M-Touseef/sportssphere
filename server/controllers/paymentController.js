const Booking = require('../models/Booking');
const TournamentRegistration = require('../models/TournamentRegistration');
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
        const { orderId, orderType = 'Booking' } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'orderId is required' });
        }

        let order;
        let amount;
        let description;

        if (orderType === 'Booking') {
            order = await Booking.findById(orderId);
            if (!order) return res.status(404).json({ error: 'Booking not found' });
            if (order.user.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
            if (order.status !== 'pending_payment') {
                return res.status(400).json({ error: `Booking status is ${order.status}` });
            }
            amount = order.totalPrice;
            description = `Booking-${order._id}`;
        } else if (orderType === 'TournamentRegistration') {
            order = await TournamentRegistration.findById(orderId);
            if (!order) return res.status(404).json({ error: 'Registration not found' });
            // Check player, player1, or player2
            const isOwner = [order.player, order.player1, order.player2].some(id => id && id.toString() === req.user.id);
            if (!isOwner) return res.status(403).json({ error: 'Not authorized' });
            if (order.paymentStatus === 'paid') {
                return res.status(400).json({ error: 'Registration already paid' });
            }
            amount = order.paymentAmount;
            description = `Tournament-${order._id}`;
        } else if (orderType === 'Session') {
            const Session = require('../models/Session');
            order = await Session.findById(orderId);
            if (!order) return res.status(404).json({ error: 'Session not found' });

            // Check if user is one of the students
            if (!order.students.some(id => id.toString() === req.user.id)) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            if (order.status !== 'pending_payment') {
                return res.status(400).json({ error: `Session status is ${order.status}` });
            }
            amount = order.totalPrice;
            description = `Session-${order._id}`;
        } else if (orderType === 'SessionCourt') {
            const Session = require('../models/Session');
            order = await Session.findById(orderId);
            if (!order) return res.status(404).json({ error: 'Session not found' });

            // Only the coach pays the court fee
            if (order.coach.toString() !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            if (order.courtPaymentStatus === 'paid') {
                return res.status(400).json({ error: 'Court fee already paid' });
            }
            amount = order.courtFee;
            description = `CourtFee-${order._id}`;
        } else {
            return res.status(400).json({ error: 'Invalid orderType' });
        }

        // 2. Generate unique transaction reference
        const txnRefNo = generateTxnRefNo();

        // 3. Create a Transaction record
        const transaction = await Transaction.create({
            orderId: order._id,
            orderType,
            userId: req.user.id,
            txnRefNo,
            amount,
            status: 'pending'
        });

        // 4. Save txnRefNo onto order
        order.txnRefNo = txnRefNo;
        await order.save();

        // 5. Build JazzCash payment parameters
        const { params, paymentUrl } = buildPaymentParams({
            amount,
            txnRefNo,
            description
        });

        console.log(`[Payment] Initiated ${orderType} txnRefNo=${txnRefNo} for order=${orderId}`);

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
        let order;
        if (transaction.orderType === 'Booking') {
            order = await Booking.findById(transaction.orderId);
        } else if (transaction.orderType === 'TournamentRegistration') {
            order = await TournamentRegistration.findById(transaction.orderId);
        } else if (transaction.orderType === 'Session' || transaction.orderType === 'SessionCourt') {
            const Session = require('../models/Session');
            order = await Session.findById(transaction.orderId);
        }

        if (responseCode === '000') {
            // SUCCESS
            transaction.status = 'paid';
            transaction.jazzcashTxnId = jazzcashTxnId;
            transaction.ipnPayload = payload;
            await transaction.save();

            if (order) {
                order.paymentStatus = 'paid';
                if (transaction.orderType === 'Booking') {
                    order.status = 'confirmed';
                } else if (transaction.orderType === 'TournamentRegistration') {
                    order.status = 'confirmed';
                } else if (transaction.orderType === 'Session') {
                    order.status = 'confirmed';
                } else if (transaction.orderType === 'SessionCourt') {
                    order.courtPaymentStatus = 'paid';
                }
                order.jazzcashTxnId = jazzcashTxnId;
                await order.save();
                console.log(`[Payment] IPN: PAID — ${transaction.orderType}=${order._id} confirmed`);
            }
        } else {
            // FAILURE
            transaction.status = 'failed';
            transaction.ipnPayload = payload;
            await transaction.save();

            if (order) {
                console.log(`[Payment] IPN: FAILED (code=${responseCode}) — ${transaction.orderType}=${order._id} unchanged`);
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
