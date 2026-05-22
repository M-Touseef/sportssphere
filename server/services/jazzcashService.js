/**
 * JazzCash MPay Utility Service
 *
 * - generateTxnRefNo()   → unique transaction reference number
 * - generateSecureHash() → HMAC-SHA256 hash per JazzCash spec
 * - buildPaymentParams() → full parameter map ready for form POST
 */

const crypto = require('crypto');

// ─── JazzCash endpoint URLs ───────────────────────────────────────────────────
const PAYMENT_URLS = {
    sandbox: 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
    production: 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/'
};

/**
 * Generate a unique transaction reference number.
 * Format: TXN_<unix-timestamp-ms>_<4-digit-random>
 * Max length ~22 chars — well within JazzCash 30-char limit.
 */
function generateTxnRefNo() {
    const timestamp = Date.now();
    const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    return `TXN_${timestamp}_${rand}`;
}

/**
 * Generate HMAC-SHA256 secure hash as required by JazzCash.
 *
 * Algorithm:
 *   1. Remove pp_SecureHash key from the params object.
 *   2. Sort remaining keys alphabetically.
 *   3. Concatenate values in that order, separated by '&'.
 *   4. Prepend the IntegritySalt followed by '&'.
 *   5. Compute HMAC-SHA256 with IntegritySalt as the key.
 *   6. Return hex digest (uppercase).
 *
 * @param {Object} params  – payment parameter map (plain key-value)
 * @param {string} salt    – pp_IntegritySalt from env
 * @returns {string}       – hex HMAC-SHA256
 */
function generateSecureHash(params, salt) {
    // 1. Exclude the hash field itself
    const filtered = { ...params };
    delete filtered.pp_SecureHash;

    // 2. Sort alphabetically by key
    const sortedKeys = Object.keys(filtered).sort();

    // 3 & 4. Build the string to hash: salt + & + joined sorted values
    const sortedValues = sortedKeys.map(k => filtered[k]);
    const hashString = salt + '&' + sortedValues.join('&');

    // 5. HMAC-SHA256
    const hmac = crypto.createHmac('sha256', salt);
    hmac.update(hashString);
    return hmac.digest('hex').toUpperCase();
}

/**
 * Verify that a received pp_SecureHash from JazzCash is valid.
 *
 * @param {Object} receivedParams  – all params from JazzCash POST
 * @param {string} salt            – IntegritySalt
 * @returns {boolean}
 */
function verifySecureHash(receivedParams, salt) {
    const receivedHash = receivedParams.pp_SecureHash;
    if (!receivedHash) return false;

    const computedHash = generateSecureHash(receivedParams, salt);
    // Constant-time comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(receivedHash, 'utf8'),
            Buffer.from(computedHash, 'utf8')
        );
    } catch {
        return false;
    }
}

/**
 * Build the full JazzCash MPay parameter map.
 *
 * @param {Object} options
 * @param {number} options.amount         – amount in PKR (whole number)
 * @param {string} options.txnRefNo       – unique transaction reference
 * @param {string} options.description    – short description (booking ID etc.)
 * @param {string} options.mobileNumber   – customer mobile (optional, can be '')
 * @returns {{ params: Object, paymentUrl: string }}
 */
function buildPaymentParams({ amount, txnRefNo, description = '', mobileNumber = '' }) {
    const env = process.env.JAZZ_ENV || 'sandbox';
    const merchantId = process.env.JAZZ_MERCHANT_ID;
    const password = process.env.JAZZ_PASSWORD;
    const salt = process.env.JAZZ_INTEGRITY_SALT;
    const returnUrl = process.env.JAZZ_RETURN_URL;
    const ipnUrl = process.env.JAZZ_IPN_URL;

    // JazzCash requires amount in paisa (PKR × 100), zero-padded to 12 digits
    const amountPaisa = String(Math.round(amount * 100)).padStart(12, '0');

    // Expiry: current time + 1 hour, formatted yyyyMMddHHmmss
    const now = new Date();
    const expiry = new Date(now.getTime() + 60 * 60 * 1000);
    const formatDate = (d) =>
        [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0'),
            String(d.getHours()).padStart(2, '0'),
            String(d.getMinutes()).padStart(2, '0'),
            String(d.getSeconds()).padStart(2, '0')
        ].join('');

    const txnDateTime = formatDate(now);
    const txnExpiryDateTime = formatDate(expiry);

    const params = {
        pp_Version: '1.1',
        pp_TxnType: 'MPAY',
        pp_Language: 'EN',
        pp_MerchantID: merchantId,
        pp_SubMerchantID: '',
        pp_Password: password,
        pp_BankID: '',
        pp_ProductID: '',
        pp_TxnRefNo: txnRefNo,
        pp_Amount: amountPaisa,
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: txnDateTime,
        pp_BillReference: description || txnRefNo,
        pp_Description: description || 'SportSphere Booking Payment',
        pp_TxnExpiryDateTime: txnExpiryDateTime,
        pp_ReturnURL: returnUrl,
        pp_SecureHash: '',       // will be replaced below
        ppmpf_1: mobileNumber,  // optional pre-filled mobile
        ppmpf_2: '',
        ppmpf_3: '',
        ppmpf_4: '',
        ppmpf_5: ''
    };

    // Attach IPN URL only if provided (not supported on all sandbox versions)
    if (ipnUrl) {
        params.pp_CallbackURL = ipnUrl;
    }

    // Generate and attach hash
    params.pp_SecureHash = generateSecureHash(params, salt);

    return {
        params,
        paymentUrl: PAYMENT_URLS[env] || PAYMENT_URLS.sandbox
    };
}

const PLACEHOLDER_VALUES = ['your_jazzcash_merchant_id', 'your_jazzcash_password', 'your_jazzcash_integrity_salt'];

function isJazzCashConfigured() {
    if (process.env.PAYMENT_MOCK_MODE === 'true') {
        return false;
    }
    const merchantId = (process.env.JAZZ_MERCHANT_ID || '').trim();
    const password = (process.env.JAZZ_PASSWORD || '').trim();
    const salt = (process.env.JAZZ_INTEGRITY_SALT || '').trim();
    if (!merchantId || !password || !salt) {
        return false;
    }
    const lower = [merchantId, password, salt].map((v) => v.toLowerCase());
    return !lower.some((v) => PLACEHOLDER_VALUES.includes(v));
}

module.exports = {
    generateTxnRefNo,
    generateSecureHash,
    verifySecureHash,
    buildPaymentParams,
    isJazzCashConfigured
};
