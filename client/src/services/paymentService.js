import axiosInstance from './axiosInstance';

/**
 * Payment Service — JazzCash MPay with demo fallback when gateway is not configured.
 */

export const getPaymentConfig = async () => {
    const response = await axiosInstance.get('/payment/config');
    return response.data;
};

export const initiatePayment = async (orderId, orderType = 'Booking') => {
    const response = await axiosInstance.post('/payment/initiate', { orderId, orderType });
    return response.data;
};

export const completeMockPayment = async (txnRefNo) => {
    const response = await axiosInstance.post('/payment/mock-complete', { txnRefNo });
    return response.data;
};

export const getPaymentStatus = async (txnRefNo) => {
    const response = await axiosInstance.get(`/payment/status/${txnRefNo}`);
    return response.data;
};

export const submitJazzCashForm = (params, actionUrl) => {
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

const runPaymentFlow = async (orderId, orderType) => {
    const data = await initiatePayment(orderId, orderType);

    if (data.mockMode) {
        await completeMockPayment(data.txnRefNo);
        return { ...data, completed: true, mockMode: true };
    }

    if (data.success && data.params && data.paymentUrl) {
        submitJazzCashForm(data.params, data.paymentUrl);
        return { ...data, completed: false, mockMode: false };
    }

    throw new Error('Failed to initiate payment');
};

export const payForBooking = async (bookingId) => {
    try {
        return await runPaymentFlow(bookingId, 'Booking');
    } catch (err) {
        console.error('payForBooking error:', err);
        throw err;
    }
};

export const payForTournamentRegistration = async (registrationId) => {
    try {
        return await runPaymentFlow(registrationId, 'TournamentRegistration');
    } catch (err) {
        console.error('payForTournamentRegistration error:', err);
        throw err;
    }
};

export const payForSession = async (sessionId) => {
    try {
        return await runPaymentFlow(sessionId, 'Session');
    } catch (err) {
        console.error('payForSession error:', err);
        throw err;
    }
};

export const payCourtFee = async (sessionId) => {
    try {
        return await runPaymentFlow(sessionId, 'SessionCourt');
    } catch (err) {
        console.error('payCourtFee error:', err);
        throw err;
    }
};

export const getPayButtonLabel = (mockMode) =>
    mockMode ? 'Confirm payment (demo)' : 'Pay Now via JazzCash';

export const getPayButtonHint = (mockMode) =>
    mockMode
        ? 'JazzCash is not connected yet — this confirms your booking instantly for testing.'
        : 'Secure payment powered by JazzCash';
