import axiosInstance from './axiosInstance';

/**
 * Payment Service — JazzCash MPay Integration
 */

/**
 * Call the backend to initiate a JazzCash payment.
 * Returns the full JazzCash parameter map and payment URL.
 *
 * @param {string} bookingId  – MongoDB ObjectId of the booking
 * @returns {{ txnRefNo, paymentUrl, params }}
 */
export const initiatePayment = async (bookingId) => {
    const response = await axiosInstance.post('/payment/initiate', { bookingId });
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
 * Call this from a "Pay Now" button handler.
 *
 * @param {string} bookingId
 * @returns {Promise<void>}  – resolves before redirect (redirect happens via form.submit())
 */
export const payForBooking = async (bookingId) => {
    const data = await initiatePayment(bookingId);
    submitJazzCashForm(data.params, data.paymentUrl);
};
