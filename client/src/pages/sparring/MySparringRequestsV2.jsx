import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import sparringService from '../../services/sparringService';
import courtService from '../../services/courtService';
import { formatSlotHourRange } from '../../utils/timeFormat';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDaysIcon,
    ClockIcon,
    MapPinIcon,
    UserIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationCircleIcon,
    ShieldCheckIcon,
    ArrowRightIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';

const MySparringRequestsV2 = () => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const isPro = user?.skillLevel === 'professional';

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchRequests();
        const refreshInterval = setInterval(() => {
            fetchRequests();
        }, 120000);
        return () => clearInterval(refreshInterval);
    }, [isPro]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setFetchError(false);
            const data = isPro
                ? await sparringService.getIncomingRequests()
                : await sparringService.getMySentRequests();
            setRequests(data.data || []);
        } catch (err) {
            console.error(err);
            setFetchError(true);
            toastError('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

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
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
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
                stripe: 'from-slate-400 to-slate-500',
                message: 'No response within 30 minutes'
            };
        }

        const configs = {
            'PENDING_RESPONSE': {
                badge: 'bg-amber-100 text-amber-800 border-amber-200',
                label: isPro ? 'ACTION REQUIRED' : 'AWAITING RESPONSE',
                icon: ClockIcon,
                iconColor: 'text-amber-500',
                stripe: 'from-amber-400 to-amber-600',
                message: timeRemaining
                    ? timeRemaining.hours > 0
                        ? `⏱️ ${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`
                        : `⏱️ ${timeRemaining.minutes}m remaining`
                    : 'Waiting for response'
            },
            'ACCEPTED': {
                badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                label: 'ACCEPTED',
                icon: CheckCircleIcon,
                iconColor: 'text-emerald-500',
                stripe: 'from-emerald-500 to-teal-600',
                message: 'Session confirmed!'
            },
            'REJECTED': {
                badge: 'bg-rose-100 text-rose-800 border-rose-200',
                label: 'REJECTED',
                icon: XCircleIcon,
                iconColor: 'text-rose-500',
                stripe: 'from-rose-500 to-red-600',
                message: 'Request declined'
            },
            'AUTO_REJECTED': {
                badge: 'bg-slate-100 text-slate-500 border-slate-200',
                label: 'AUTO-REJECTED',
                icon: ExclamationCircleIcon,
                iconColor: 'text-slate-400',
                stripe: 'from-slate-400 to-slate-500',
                message: 'No response within 30 minutes'
            }
        };

        return configs[status] || configs['PENDING_RESPONSE'];
    };

    const stats = useMemo(() => {
        const pending = requests.filter(r => r.status === 'PENDING_RESPONSE').length;
        const accepted = requests.filter(r => r.status === 'ACCEPTED').length;
        return { total: requests.length, pending, accepted };
    }, [requests]);

    return (
        <div className="pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.75rem] mb-10 sm:mb-12 border border-amber-200/60 shadow-[0_24px_70px_-28px_rgba(30,27,75,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-teal-900" />
                <div className="absolute -top-16 -right-8 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="relative px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 border border-amber-300/30 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-100 mb-5">
                                <UserIcon className="h-4 w-4 text-amber-300" />
                                {isPro ? 'Pro requests' : 'Your schedule'}
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                                {isPro ? 'Incoming' : 'Sparring'}
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-teal-200">
                                    requests
                                </span>
                            </h1>
                            <p className="mt-4 text-base sm:text-lg text-indigo-100/85 font-medium max-w-xl">
                                {isPro ? 'Manage requests from other players.' : 'Track the status of your sparring session requests.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 lg:justify-end items-center">
                            {!loading && !fetchError && (
                                <>
                                    <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 px-5 py-4 min-w-[5.5rem]">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100/70">Total</p>
                                        <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
                                    </div>
                                    {stats.pending > 0 && (
                                        <div className="rounded-2xl bg-amber-500/25 backdrop-blur border border-amber-300/30 px-5 py-4 min-w-[5.5rem]">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100">Pending</p>
                                            <p className="text-2xl font-black text-white mt-1">{stats.pending}</p>
                                        </div>
                                    )}
                                    <div className="rounded-2xl bg-emerald-500/20 backdrop-blur border border-emerald-300/25 px-5 py-4 min-w-[5.5rem]">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/80">Accepted</p>
                                        <p className="text-2xl font-black text-white mt-1">{stats.accepted}</p>
                                    </div>
                                </>
                            )}
                            {!isPro && (
                                <Link to="/sparring/browse">
                                    <Button className="h-12 px-6 rounded-2xl font-bold bg-amber-400 hover:bg-amber-300 text-indigo-950 shadow-lg">
                                        Find a Pro
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {loading ? (
                <CardSkeleton count={4} />
            ) : fetchError ? (
                <div className="flex flex-col items-center p-12 rounded-[2rem] border-2 border-dashed border-amber-200 bg-amber-50/30 text-center gap-6">
                    <ExclamationCircleIcon className="h-12 w-12 text-amber-700" />
                    <p className="text-lg font-bold text-slate-800">Could not load requests</p>
                    <Button onClick={fetchRequests} className="bg-indigo-950 text-amber-50 rounded-2xl px-8 font-bold">
                        Retry
                    </Button>
                </div>
            ) : requests.length > 0 ? (
                <div className="grid gap-6 sm:gap-8">
                    <AnimatePresence mode="popLayout">
                        {requests.map((req, index) => {
                            const statusConfig = getStatusConfig(req.status, req.responseDeadline);
                            const StatusIcon = statusConfig.icon;
                            
                            const displayUser = isPro ? req.requester : req.proPlayer;
                            const displayName = displayUser?.name || (isPro ? 'Unknown Player' : 'Professional');
                            const displayEmail = displayUser?.email;

                            return (
                                <motion.article
                                    key={req._id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="group relative bg-white rounded-[1.75rem] sm:rounded-[2rem] border border-amber-100/90 shadow-[0_16px_48px_-20px_rgba(30,27,75,0.12)] overflow-hidden hover:shadow-[0_24px_56px_-20px_rgba(30,27,75,0.18)] transition-all"
                                >
                                    <div
                                        className={twMerge(
                                            'absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b',
                                            statusConfig.stripe
                                        )}
                                    />

                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6 p-6 sm:p-8 pl-8">
                                        <div className="flex gap-4 flex-1 min-w-0">
                                            <div className={twMerge(
                                                "h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl flex items-center justify-center text-amber-200 shadow-md",
                                                isPro ? "bg-indigo-950 text-indigo-200" : "bg-rose-950 text-rose-200"
                                            )}>
                                                <UserIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">
                                                        {displayName}
                                                    </h3>
                                                    <span
                                                        className={twMerge(
                                                            'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
                                                            statusConfig.badge
                                                        )}
                                                    >
                                                        {statusConfig.label}
                                                    </span>
                                                    {!isPro && req.status === 'ACCEPTED' && req.booking?.paymentStatus === 'paid' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-600 text-white">
                                                            <ShieldCheckIcon className="h-3.5 w-3.5" />
                                                            Paid
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-slate-600 flex items-center gap-1.5 mb-4 truncate">
                                                    <MapPinIcon className="h-4 w-4 text-amber-700 shrink-0" />
                                                    {req.availabilitySlot?.venue?.name || 'Location TBA'}
                                                    <span className="text-slate-400 font-normal">({displayEmail})</span>
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-950 bg-gradient-to-r from-slate-50 to-amber-50/60 border border-amber-100 px-3 py-2 rounded-xl">
                                                        <CalendarDaysIcon className="h-4 w-4 text-indigo-800" />
                                                        {req.availabilitySlot && formatDate(req.availabilitySlot.date)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-950 bg-gradient-to-r from-slate-50 to-amber-50/60 border border-amber-100 px-3 py-2 rounded-xl">
                                                        <ClockIcon className="h-4 w-4 text-indigo-800" />
                                                        {req.availabilitySlot && formatSlotHourRange(req.availabilitySlot.startTime, req.availabilitySlot.endTime)}
                                                    </span>
                                                    {!isPro && req.booking && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-black text-indigo-950 bg-indigo-950/5 border border-indigo-100 px-3 py-2 rounded-xl">
                                                            Rs.{req.booking.totalPrice}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-44">
                                            {isPro && req.status === 'PENDING_RESPONSE' && (
                                                <>
                                                    <Button
                                                        onClick={() => handleAccept(req._id)}
                                                        className="h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleReject(req._id)}
                                                        className="h-11 rounded-xl font-bold border-rose-200 text-rose-600 hover:bg-rose-50 text-sm"
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {!isPro && req.status === 'ACCEPTED' && req.booking && req.booking.status === 'pending_payment' && (
                                                <Button
                                                    onClick={() => handlePayment(req.booking._id)}
                                                    className="h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                                                >
                                                    Pay Now
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Additional info block */}
                                    {(req.message || statusConfig.message) && (
                                        <div className="px-6 sm:px-8 py-3 bg-amber-50/50 border-t border-amber-100/50 flex flex-col gap-2">
                                            {req.message && (
                                                <p className="text-sm font-medium text-amber-900/70 italic">
                                                    "{req.message}"
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <StatusIcon className={twMerge("h-4 w-4", statusConfig.iconColor)} />
                                                <span>{statusConfig.message}</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.article>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50/80 to-indigo-50/30"
                >
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-indigo-950 flex items-center justify-center text-amber-300 mb-6">
                        <UserIcon className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900">
                        {isPro ? 'No incoming requests' : 'No sparring requests'}
                    </h3>
                    <p className="text-slate-600 font-medium mt-2 max-w-md mx-auto">
                        {isPro
                            ? "You haven't received any requests yet."
                            : "You haven't sent any sparring requests yet."}
                    </p>
                    {!isPro && (
                        <Link to="/sparring/browse" className="inline-block mt-8">
                            <Button className="px-10 h-14 rounded-2xl font-bold bg-indigo-950 text-amber-50 gap-2">
                                Find a Pro
                                <ArrowRightIcon className="h-5 w-5" />
                            </Button>
                        </Link>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default MySparringRequestsV2;
