import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import sparringService from '../../services/sparringService';
import { formatSlotHourRange } from '../../utils/timeFormat';
import courtService from '../../services/courtService';
import Button from '../../components/ui/Button';
import {
    CalendarDaysIcon,
    ClockIcon,
    MapPinIcon,
    UserIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

const MySparringRequestsV2 = () => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const isPro = user?.skillLevel === 'professional';

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Auto-refresh every 2 minutes
    useEffect(() => {
        fetchRequests();
        const refreshInterval = setInterval(() => {
            fetchRequests();
        }, 120000);
        return () => clearInterval(refreshInterval);
    }, [isPro]); // Re-fetch if role changes (unlikely)

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = isPro
                ? await sparringService.getIncomingRequests()
                : await sparringService.getMySentRequests();
            setRequests(data.data);
        } catch (err) {
            console.error(err);
            toastError('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    // Professional Actions
    const handleAccept = async (requestId) => {
        try {
            await sparringService.acceptRequest(requestId);
            success('Request accepted!');
            fetchRequests();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to accept');
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm('Reject this request?')) return;
        try {
            await sparringService.rejectRequest(requestId);
            success('Request rejected');
            fetchRequests();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to reject');
        }
    };

    // Non-Professional Actions
    const handlePayment = async (bookingId) => {
        try {
            const confirmed = window.confirm("Authorize payment for court and professional fees?");
            if (!confirmed) return;

            setLoading(true);
            await courtService.confirmPayment(bookingId);
            success('Payment successful!');
            fetchRequests();
        } catch (err) {
            toastError(err.response?.data?.error || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
    });

    const getTimeRemaining = (deadline) => {
        const diff = new Date(deadline) - currentTime;
        if (diff <= 0) return { expired: true, hours: 0, minutes: 0 };
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return { expired: false, hours, minutes };
    };

    const getStatusConfig = (status, deadline) => {
        const timeRemaining = deadline ? getTimeRemaining(deadline) : null;
        const isExpired = timeRemaining?.expired && status === 'PENDING_RESPONSE';

        if (isExpired) {
            return {
                badge: 'bg-slate-100 text-slate-500 border-slate-200',
                label: 'EXPIRED',
                icon: ExclamationCircleIcon,
                iconColor: 'text-slate-400',
                message: 'No response within 30 minutes'
            };
        }

        const configs = {
            'PENDING_RESPONSE': {
                badge: 'bg-amber-50 text-amber-600 border-amber-100',
                label: isPro ? 'ACTION REQUIRED' : 'AWAITING RESPONSE',
                icon: ClockIcon,
                iconColor: 'text-amber-500',
                message: timeRemaining
                    ? timeRemaining.hours > 0
                        ? `⏱️ ${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`
                        : `⏱️ ${timeRemaining.minutes}m remaining (30 min limit)`
                    : 'Waiting for response (30 min limit)'
            },
            'ACCEPTED': {
                badge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                label: 'ACCEPTED',
                icon: CheckCircleIcon,
                iconColor: 'text-emerald-500',
                message: 'Session confirmed!'
            },
            'REJECTED': {
                badge: 'bg-rose-50 text-rose-600 border-rose-100',
                label: 'REJECTED',
                icon: XCircleIcon,
                iconColor: 'text-rose-500',
                message: 'Request declined'
            },
            'AUTO_REJECTED': {
                badge: 'bg-slate-100 text-slate-500 border-slate-200',
                label: 'AUTO-REJECTED',
                icon: ExclamationCircleIcon,
                iconColor: 'text-slate-400',
                message: 'No response within 30 minutes'
            }
        };

        return configs[status] || configs['PENDING_RESPONSE'];
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
            <div className="flex items-center gap-4 mb-12">
                {!isPro && (
                    <Link to="/sparring/browse">
                        <button className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                    </Link>
                )}
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        {isPro ? 'Incoming Requests' : 'My Sparring Requests'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {isPro ? 'Manage requests from other players.' : 'Track the status of your sparring session requests.'}
                    </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-40 bg-slate-50 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : requests.length > 0 ? (
                    <div className="space-y-6">
                        {requests.map(req => {
                            const statusConfig = getStatusConfig(req.status, req.responseDeadline);
                            const StatusIcon = statusConfig.icon;

                            // Determine user info to display (Opposite of current user)
                            const displayUser = isPro ? req.requester : req.proPlayer;
                            const displayName = displayUser?.name || (isPro ? 'Unknown Player' : 'Professional');
                            const displayEmail = displayUser?.email;

                            return (
                                <motion.div
                                    key={req._id}
                                    layout
                                    className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
                                >
                                    <div className="p-8">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold ${isPro ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {displayName[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{displayName}</p>
                                                        <p className="text-xs text-slate-500">{displayEmail}</p>
                                                    </div>
                                                </div>

                                                {req.availabilitySlot && (
                                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                                                        <span className="flex items-center gap-1.5">
                                                            <CalendarDaysIcon className="h-4 w-4 text-indigo-500" />
                                                            {formatDate(req.availabilitySlot.date)}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <ClockIcon className="h-4 w-4 text-indigo-500" />
                                                            {formatSlotHourRange(req.availabilitySlot.startTime, req.availabilitySlot.endTime)}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPinIcon className="h-4 w-4 text-indigo-500" />
                                                            {req.availabilitySlot.venue?.name}
                                                        </span>
                                                    </div>
                                                )}

                                                {req.message && (
                                                    <p className="text-sm text-slate-500 italic mb-4">"{req.message}"</p>
                                                )}

                                                {/* Pro Actions within the card */}
                                                {isPro && req.status === 'PENDING_RESPONSE' && (
                                                    <div className="flex gap-3 mt-4">
                                                        <Button
                                                            onClick={() => handleAccept(req._id)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6 rounded-xl text-sm"
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleReject(req._id)}
                                                            variant="outline"
                                                            className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold h-10 px-6 rounded-xl text-sm"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <span className={twMerge(
                                                "px-4 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-widest whitespace-nowrap",
                                                statusConfig.badge
                                            )}>
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        {/* Status Message */}
                                        <div className={twMerge(
                                            "mt-4 px-4 py-3 rounded-xl flex items-center gap-3",
                                            req.status === 'ACCEPTED' ? "bg-emerald-50 border border-emerald-100" :
                                                req.status === 'PENDING_RESPONSE' ? "bg-amber-50 border border-amber-100" :
                                                    "bg-slate-50 border border-slate-100"
                                        )}>
                                            <StatusIcon className={twMerge("h-5 w-5", statusConfig.iconColor)} />
                                            <p className="text-xs font-bold text-slate-600">{statusConfig.message}</p>
                                        </div>
                                    </div>

                                    {/* Non-Pro Payment Logic */}
                                    {!isPro && req.status === 'ACCEPTED' && req.booking && (
                                        <div className="bg-indigo-50 border-t border-indigo-100 px-8 py-6">
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Total Fee</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-2xl font-black text-indigo-900">Rs. {req.booking.totalPrice}</span>
                                                    </div>
                                                </div>

                                                {req.booking.status === 'pending_payment' ? (
                                                    <Button
                                                        onClick={() => handlePayment(req.booking._id)}
                                                        className="h-14 px-10 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100"
                                                    >
                                                        Pay Now
                                                    </Button>
                                                ) : req.booking.paymentStatus === 'paid' ? (
                                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-200">
                                                        <CheckCircleIcon className="h-5 w-5" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">Payment Completed</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center">
                        <UserIcon className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-2xl font-extrabold text-slate-900">
                            {isPro ? 'No Incoming Requests' : 'No Sparring Requests'}
                        </h3>
                        <p className="text-slate-500 mt-2">
                            {isPro
                                ? "You haven't received any requests yet."
                                : "You haven't sent any sparring requests yet."}
                        </p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MySparringRequestsV2;
