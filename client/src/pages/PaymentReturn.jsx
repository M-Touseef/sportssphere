import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPaymentStatus } from '../services/paymentService';

/**
 * PaymentReturn — shown after JazzCash redirects the user back.
 *
 * Query params received from backend redirect:
 *   ?status=success|failed|error
 *   &code=<pp_ResponseCode>
 *   &txnRef=<pp_TxnRefNo>
 *   &message=<pp_ResponseMessage>
 */
const PaymentReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const status = searchParams.get('status');        // success | failed | error
    const code = searchParams.get('code');            // 000 = success
    const txnRef = searchParams.get('txnRef');
    const message = searchParams.get('message');

    const [txnStatus, setTxnStatus] = useState(null);
    const [polling, setPolling] = useState(false);

    const isSuccess = status === 'success' && code === '000';

    // Poll transaction status to confirm IPN was received
    useEffect(() => {
        if (!txnRef || !isSuccess) return;

        setPolling(true);
        let attempts = 0;
        const maxAttempts = 6;

        const poll = async () => {
            try {
                attempts++;
                const data = await getPaymentStatus(txnRef);
                if (data?.data?.status === 'paid') {
                    setTxnStatus('confirmed');
                    setPolling(false);
                    return;
                }
                if (attempts < maxAttempts) {
                    setTimeout(poll, 3000);
                } else {
                    setTxnStatus('pending_ipn');
                    setPolling(false);
                }
            } catch {
                setTxnStatus('pending_ipn');
                setPolling(false);
            }
        };

        setTimeout(poll, 2000); // Give IPN 2s head start
    }, [txnRef, isSuccess]);

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Icon */}
                <div style={{
                    ...styles.iconCircle,
                    background: isSuccess ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'
                }}>
                    {isSuccess ? (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="12" fill="#10b981" fillOpacity="0.15" />
                            <path d="M7 13l3 3 7-7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="12" fill="#ef4444" fillOpacity="0.15" />
                            <path d="M8 8l8 8M16 8l-8 8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    )}
                </div>

                {/* Heading */}
                <h1 style={{
                    ...styles.heading,
                    color: isSuccess ? '#10b981' : '#ef4444'
                }}>
                    {isSuccess ? 'Payment Successful!' : 'Payment Did Not Complete'}
                </h1>

                {/* Subtext */}
                <p style={styles.subtext}>
                    {isSuccess
                        ? 'Your payment was processed via JazzCash. Your booking is being confirmed.'
                        : (message || 'Your payment could not be completed. No money has been deducted.')}
                </p>

                {/* Transaction Ref */}
                {txnRef && (
                    <div style={styles.refBox}>
                        <span style={styles.refLabel}>Transaction Reference</span>
                        <span style={styles.refValue}>{txnRef}</span>
                    </div>
                )}

                {/* IPN polling status */}
                {isSuccess && (
                    <div style={styles.statusBox}>
                        {polling && (
                            <span style={{ color: '#6366f1', fontSize: 14 }}>
                                ⏳ Confirming booking with server…
                            </span>
                        )}
                        {!polling && txnStatus === 'confirmed' && (
                            <span style={{ color: '#10b981', fontSize: 14, fontWeight: 600 }}>
                                ✅ Booking confirmed!
                            </span>
                        )}
                        {!polling && txnStatus === 'pending_ipn' && (
                            <span style={{ color: '#f59e0b', fontSize: 14 }}>
                                ⚠️ Still processing — your booking will auto-confirm within 1 minute.
                            </span>
                        )}
                    </div>
                )}

                {/* Response code badge */}
                {code && (
                    <p style={styles.codeBadge}>
                        Response Code: <strong>{code}</strong>
                    </p>
                )}

                {/* Actions */}
                <div style={styles.actions}>
                    <button
                        style={{ ...styles.btn, background: isSuccess ? '#10b981' : '#6366f1' }}
                        onClick={() => navigate('/app/bookings')}
                    >
                        View My Bookings
                    </button>
                    {!isSuccess && (
                        <button
                            style={{ ...styles.btn, background: '#6b7280' }}
                            onClick={() => navigate(-1)}
                        >
                            Go Back
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Inline styles ─────────────────────────────────────────────────────────────
const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: '24px'
    },
    card: {
        background: '#ffffff',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.10)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        textAlign: 'center'
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '8px'
    },
    heading: {
        fontSize: '26px',
        fontWeight: 700,
        margin: 0
    },
    subtext: {
        color: '#6b7280',
        fontSize: '15px',
        lineHeight: 1.6,
        margin: 0
    },
    refBox: {
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '12px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width: '100%',
        boxSizing: 'border-box'
    },
    refLabel: {
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#9ca3af'
    },
    refValue: {
        fontSize: '14px',
        fontWeight: 700,
        color: '#111827',
        fontFamily: 'monospace',
        wordBreak: 'break-all'
    },
    statusBox: {
        width: '100%',
        padding: '12px 16px',
        background: '#fffbeb',
        borderRadius: '8px',
        border: '1px solid #fde68a'
    },
    codeBadge: {
        fontSize: '12px',
        color: '#9ca3af',
        margin: 0
    },
    actions: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: '8px',
        width: '100%'
    },
    btn: {
        padding: '12px 24px',
        borderRadius: '10px',
        border: 'none',
        color: '#fff',
        fontWeight: 600,
        fontSize: '15px',
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        flex: '1 1 140px',
        minWidth: '140px'
    }
};

export default PaymentReturn;
