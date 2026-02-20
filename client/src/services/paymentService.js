import axiosInstance from './axiosInstance';

/**
 * Payment Service — JazzCash MPay Integration
 */

/**
 * Call the backend to initiate a JazzCash payment.
 * Returns the full JazzCash parameter map and payment URL.
 *
 * @param {string} orderId   – MongoDB ObjectId of the order
 * @param {string} orderType - 'Booking' or 'TournamentRegistration'
 * @returns {{ txnRefNo, paymentUrl, params }}
 */
export const initiatePayment = async (orderId, orderType = 'Booking') => {
    const response = await axiosInstance.post('/payment/initiate', { orderId, orderType });
    return response.data;
};

/**
 * Poll the transaction status by txnRefNo.
 * Useful for checking whether the IPN has been received after return.
 *
 * @param {string} txnRefNo
 * @returns {{ status, amount, booking, ... }}
 */
export const getPaymentStatus = async (txnRefNo) => {
    const response = await axiosInstance.get(`/payment/status/${txnRefNo}`);
    return response.data;
};

/**
 * Dynamically creates a hidden HTML form and submits it to JazzCash.
 * This triggers a full-page browser redirect to the JazzCash payment portal.
 *
 * @param {Object} params      – JazzCash parameter map from backend
 * @param {string} actionUrl   – JazzCash payment URL (sandbox or production)
 */
export const submitJazzCashForm = (params, actionUrl) => {
    // Remove any existing jazzcash-form
    const existingForm = document.getElementById('jazzcash-payment-form');
    if (existingForm) existingForm.remove();

    const form = document.createElement('form');
    form.setAttribute('id', 'jazzcash-payment-form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', actionUrl);

    Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', key);
        input.setAttribute('value', value ?? '');
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
};

/**
 * Full convenience function: initiate payment then auto-submit to JazzCash.
 * Call this from a "Pay Now" button handler or auto-redirect flow.
 *
 * @param {string} bookingId
 * @returns {Promise<void>}
 */
export const payForBooking = async (bookingId) => {
    try {
        const data = await initiatePayment(bookingId, 'Booking');
        if (data.success && data.params && data.paymentUrl) {
            submitJazzCashForm(data.params, data.paymentUrl);
        } else {
            throw new Error('Failed to initiate payment');
        }
    } catch (err) {
        console.error('payForBooking error:', err);
        throw err;
    }
};

/**
 * Full convenience function for tournament registration payment.
 *
 * @param {string} registrationId
 * @returns {Promise<void>}
 */
export const payForTournamentRegistration = async (registrationId) => {
    try {
        const data = await initiatePayment(registrationId, 'TournamentRegistration');
        if (data.success && data.params && data.paymentUrl) {
            submitJazzCashForm(data.params, data.paymentUrl);
        } else {
            throw new Error('Failed to initiate payment');
        }
    } catch (err) {
        console.error('payForTournamentRegistration error:', err);
        throw err;
    }
};
/**
 * Full convenience function for coaching session payment.
 *
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export const payForSession = async (sessionId) => {
    try {
        const data = await initiatePayment(sessionId, 'Session');
        if (data.success && data.params && data.paymentUrl) {
            submitJazzCashForm(data.params, data.paymentUrl);
        } else {
            throw new Error('Failed to initiate payment');
        }
    } catch (err) {
        console.error('payForSession error:', err);
        throw err;
    }
};

/**
 * Full convenience function for coach court fee payment.
 *
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export const payCourtFee = async (sessionId) => {
    try {
        const data = await initiatePayment(sessionId, 'SessionCourt');
        if (data.success && data.params && data.paymentUrl) {
            submitJazzCashForm(data.params, data.paymentUrl);
        } else {
            throw new Error('Failed to initiate payment');
        }
    } catch (err) {
        console.error('payCourtFee error:', err);
        throw err;
    }
};

