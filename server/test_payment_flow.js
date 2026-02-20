/**
 * JazzCash Payment Flow Test Script
 *
 * Tests the payment initiation logic and simulates an IPN callback.
 * Run: node test_payment_flow.js
 *
 * Prerequisites:
 *   - Server running on port 5000
 *   - A test user account in the DB
 *   - A court with an available time slot
 */

const axios = require('axios');
const crypto = require('crypto');

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'testuser@sportssphere.com';
const TEST_PASSWORD = 'Test@123';

// These MUST match server .env values for the hash test to pass
const JAZZ_MERCHANT_ID = process.env.JAZZ_MERCHANT_ID || 'MC12345';
const JAZZ_INTEGRITY_SALT = process.env.JAZZ_INTEGRITY_SALT || 'sandbox_salt';

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function generateSecureHash(params, salt) {
    const filtered = { ...params };
    delete filtered.pp_SecureHash;
    const sortedKeys = Object.keys(filtered).sort();
    const sortedValues = sortedKeys.map(k => filtered[k]);
    const hashString = salt + '&' + sortedValues.join('&');
    const hmac = crypto.createHmac('sha256', salt);
    hmac.update(hashString);
    return hmac.digest('hex').toUpperCase();
}

function log(label, value) {
    const icon = label.startsWith('✅') ? '' : label.startsWith('❌') ? '' : '→';
    console.log(`\n${label}`, typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function run() {
    console.log('\n═══════════════════════════════════════════════════');
    console.log(' JazzCash Payment Flow Integration Test');
    console.log('═══════════════════════════════════════════════════\n');

    let token, bookingId, txnRefNo;

    // STEP 1: Login
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        token = res.data.token;
        log('✅ [1] Login successful:', `Token = ${token?.substring(0, 30)}...`);
    } catch (err) {
        const detail = err.response?.data || err.code || err.message;
        log('❌ [1] Login failed:', detail);
        if (err.code === 'ECONNREFUSED') {
            console.log('\n⚠  Server is NOT running. Start it first:\n   cd server && npm run dev\n');
        } else {
            console.log(`\n⚠  Check credentials: email="${TEST_EMAIL}" password="${TEST_PASSWORD}"\n   Or register the user first via POST /api/auth/register\n`);
        }
        return;
    }

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // STEP 2: Find a booking with status='pending_payment'
    try {
        const res = await axios.get(`${BASE_URL}/bookings/my`, authHeader);
        const pending = res.data.data.find(b => b.status === 'pending_payment');
        if (!pending) {
            log('⚠ [2] No pending_payment bookings found.', 'Create a booking via /api/bookings first, then set its status to pending_payment in the DB.');
            return;
        }
        bookingId = pending._id;
        log('✅ [2] Found pending_payment booking:', bookingId);
    } catch (err) {
        log('❌ [2] Could not fetch bookings:', err.response?.data || err.message);
        return;
    }

    // STEP 3: Initiate Payment
    try {
        const res = await axios.post(`${BASE_URL}/payment/initiate`, { bookingId }, authHeader);
        txnRefNo = res.data.txnRefNo;
        log('✅ [3] Payment initiated successfully:');
        log('   txnRefNo', txnRefNo);
        log('   paymentUrl', res.data.paymentUrl);
        log('   pp_SecureHash present', !!res.data.params?.pp_SecureHash);
        log('   pp_Amount (paisa)', res.data.params?.pp_Amount);

        if (!txnRefNo) throw new Error('No txnRefNo in response');
        if (!res.data.params?.pp_SecureHash) throw new Error('No pp_SecureHash in params');
    } catch (err) {
        log('❌ [3] Payment initiation failed:', err.response?.data || err.message);
        return;
    }

    // STEP 4: Simulate IPN (server-to-server, no auth)
    try {
        const ipnPayload = {
            pp_Version: '1.1',
            pp_TxnType: 'MPAY',
            pp_MerchantID: JAZZ_MERCHANT_ID,
            pp_SubMerchantID: '',
            pp_Password: 'sandbox_password',
            pp_TxnRefNo: txnRefNo,
            pp_Amount: '0000000100000', // 1000 PKR in paisa (adjust to match booking)
            pp_TxnCurrency: 'PKR',
            pp_TxnDateTime: '20260220043800',
            pp_BillReference: bookingId,
            pp_Description: `Booking-${bookingId}`,
            pp_TxnExpiryDateTime: '20260220053800',
            pp_ResponseCode: '000',
            pp_ResponseMessage: 'Transaction Processed Successfully.',
            pp_ReturnURL: 'http://localhost:5173/payment/return',
            pp_SecureHash: ''
        };
        // Generate a valid hash so IPN endpoint accepts it
        ipnPayload.pp_SecureHash = generateSecureHash(ipnPayload, JAZZ_INTEGRITY_SALT);

        const res = await axios.post(`${BASE_URL}/payment/ipn`, ipnPayload);
        log('✅ [4] IPN simulated:', res.data);
    } catch (err) {
        log('❌ [4] IPN simulation failed:', err.response?.data || err.message);
        return;
    }

    // STEP 5: Verify transaction status
    try {
        const res = await axios.get(`${BASE_URL}/payment/status/${txnRefNo}`, authHeader);
        const data = res.data.data;
        log('✅ [5] Transaction status after IPN:');
        log('   status', data.status);
        log('   booking.paymentStatus', data.booking?.paymentStatus);
        log('   booking.status', data.booking?.status);

        if (data.status !== 'paid') {
            log('❌ Transaction status is not "paid" — IPN processing may have failed.', '');
        } else if (data.booking?.paymentStatus !== 'paid' || data.booking?.status !== 'confirmed') {
            log('❌ Booking not updated correctly after IPN.', '');
        } else {
            console.log('\n✅ ALL TESTS PASSED — JazzCash payment flow is working correctly! ✅\n');
        }
    } catch (err) {
        log('❌ [5] Could not fetch transaction status:', err.response?.data || err.message);
    }
}

run().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
