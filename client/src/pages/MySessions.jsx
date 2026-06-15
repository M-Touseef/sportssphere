import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import sessionService from '../services/sessionService';
import * as paymentService from '../services/paymentService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import {
    CalendarIcon,
    MapPinIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    UserIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

const STATUS_CONFIG = {
    confirmed: {
        label: 'Confirmed',
        badge: 'bg-lime-100 text-lime-800 border-lime-200',
        stripe: 'from-lime-400 to-sky-500'
    },
    pending: {
        label: 'Pending',
        badge: 'bg-amber-100 text-amber-900 border-amber-200',
        stripe: 'from-amber-400 to-amber-600'
    },
    pending_payment: {
        label: 'Awaiting payment',
        badge: 'bg-amber-100 text-amber-900 border-amber-200',
        stripe: 'from-amber-500 to-orange-500'
    },
    cancelled: {
        label: 'Cancelled',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
        stripe: 'from-rose-500 to-red-600'
    },
    completed: {
        label: 'Completed',
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        stripe: 'from-slate-600 to-slate-900'
    }
};

const MySessions = () => {
    const { success, error: toastError } = useToast();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [filter, setFilter] = useState('all');
    const [payingSessionId, setPayingSessionId] = useState(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setFetchError(false);
            const data = await sessionService.getMySessions();
            setSessions(data.data || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            setFetchError(true);
            toastError('Could not load your sessions.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSession = async (sessionId) => {
        if (!window.confirm('Are you sure you want to cancel this session?')) {
            return;
        }

        try {
            await sessionService.cancelSession(sessionId);
            fetchSessions();
        } catch (error) {
            console.error('Error cancelling session:', error);
            toastError('Failed to cancel session');
        }
    };

    const handlePayment = async (sessionId) => {
        try {
            setPayingSessionId(sessionId);
            const result = await paymentService.payForSession(sessionId);
            if (result?.completed) {
                success('Session confirmed (demo payment).');
                fetchSessions();
            }
        } catch (err) {
            console.error('Payment error:', err);
            toastError(err?.response?.data?.error || 'Failed to complete payment.');
        } finally {
            setPayingSessionId(null);
        }
    };

    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            const sessionDate = new Date(session.date);
            const now = new Date();
            if (filter === 'upcoming') {
                return sessionDate >= now && session.status !== 'cancelled' && session.status !== 'completed';
            } else if (filter === 'past') {
                return sessionDate < now || session.status === 'completed';
            }
            return true;
        });
    }, [sessions, filter]);

    const stats = useMemo(() => {
        const upcoming = sessions.filter(s => {
            const sessionDate = new Date(s.date);
            return sessionDate >= new Date() && s.status !== 'cancelled' && s.status !== 'completed';
        }).length;
        const due = sessions.filter(s => s.status === 'pending_payment').length;
        return { total: sessions.length, upcoming, due };
    }, [sessions]);

    return (
        <div className="pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.75rem] mb-10 sm:mb-12 border border-slate-800 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)]">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950" />
                <div className="absolute -top-16 -right-8 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
                <div className="relative px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-100 mb-5">
                                <CalendarIcon className="h-4 w-4 text-lime-300" />
                                Your schedule
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                                Coaching
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-lime-300">
                                    sessions
                                </span>
                            </h1>
                            <p className="mt-4 text-base sm:text-lg text-slate-300 font-medium max-w-xl">
                                View and manage your coaching sessions in one place.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 lg:justify-end items-center">
                            {!loading && !fetchError && (
                                <>
                                    <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 px-5 py-4 min-w-[5.5rem]">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Total</p>
                                        <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
                                    </div>
                                    <div className="rounded-2xl bg-emerald-500/20 backdrop-blur border border-emerald-300/25 px-5 py-4 min-w-[5.5rem]">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/80">Upcoming</p>
                                        <p className="text-2xl font-black text-white mt-1">{stats.upcoming}</p>
                                    </div>
                                    {stats.due > 0 && (
                                        <div className="rounded-2xl bg-amber-500/25 backdrop-blur border border-amber-300/30 px-5 py-4 min-w-[5.5rem]">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100">Due</p>
                                            <p className="text-2xl font-black text-white mt-1">{stats.due}</p>
                                        </div>
                                    )}
                                </>
                            )}
                            <Link to="/coaches">
                                <Button className="h-12 px-6 rounded-2xl font-bold bg-lime-300 hover:bg-lime-200 text-slate-950 shadow-lg">
                                    Find a coach
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
                {['all', 'upcoming', 'past'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${filter === tab ? 'bg-slate-950 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:border-sky-200 hover:text-sky-800'}`}
                    >
                        {tab === 'all' ? `All Sessions (${sessions.length})` : tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <CardSkeleton count={4} />
            ) : fetchError ? (
                <div className="flex flex-col items-center p-12 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 text-center gap-6">
                    <ExclamationTriangleIcon className="h-12 w-12 text-amber-700" />
                    <p className="text-lg font-bold text-slate-800">Could not load sessions</p>
                    <Button onClick={fetchSessions} className="bg-slate-950 text-white rounded-2xl px-8 font-bold">
                        Retry
                    </Button>
                </div>
            ) : filteredSessions.length > 0 ? (
                <div className="grid gap-6 sm:gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredSessions.map((session, index) => {
                            const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
                            const isPaid = session.paymentStatus === 'paid' || session.status === 'confirmed';
                            const needsPay = session.status === 'pending_payment';

                            return (
                                <Motion.article
                                    key={session._id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="group relative bg-white rounded-[1.75rem] sm:rounded-[2rem] border border-slate-200 shadow-[0_16px_48px_-20px_rgba(15,23,42,0.14)] overflow-hidden hover:border-sky-200 hover:shadow-[0_24px_56px_-20px_rgba(14,116,144,0.2)] transition-all"
                                >
                                    <div
                                        className={twMerge(
                                            'absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b',
                                            statusCfg.stripe
                                        )}
                                    />

                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6 p-6 sm:p-8 pl-8">
                                        <div className="flex gap-4 flex-1 min-w-0">
                                            <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl bg-slate-950 flex items-center justify-center text-lime-200 shadow-md">
                                                <UserIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">
                                                        {session.coach.name}
                                                    </h3>
                                                    <span
                                                        className={twMerge(
                                                            'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
                                                            statusCfg.badge
                                                        )}
                                                    >
                                                        {statusCfg.label}
                                                    </span>
                                                    {isPaid && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-600 text-white">
                                                            <ShieldCheckIcon className="h-3.5 w-3.5" />
                                                            Paid
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-slate-600 flex items-center gap-1.5 mb-4 truncate">
                                                    <MapPinIcon className="h-4 w-4 text-sky-700 shrink-0" />
                                                    {session.location || 'Location TBA'}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                                                        <CalendarIcon className="h-4 w-4 text-sky-700" />
                                                        {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                                                        <ClockIcon className="h-4 w-4 text-sky-700" />
                                                        {session.startTime} - {session.endTime} ({session.duration}h)
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-xs font-black text-slate-950 bg-sky-50 border border-sky-100 px-3 py-2 rounded-xl">
                                                        Rs.{session.totalPrice}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-44">
                                            {needsPay && (
                                                <Button
                                                    onClick={() => handlePayment(session._id)}
                                                    disabled={payingSessionId === session._id}
                                                    isLoading={payingSessionId === session._id}
                                                    className="h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                                                >
                                                    Pay Now
                                                </Button>
                                            )}
                                            {(session.status === 'confirmed' || session.status === 'pending') && new Date(session.date) > new Date() && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleCancelSession(session._id)}
                                                    className="w-full h-11 rounded-xl font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
                                                >
                                                    Cancel Session
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {session.notes && (
                                        <div className="px-6 sm:px-8 py-3 bg-amber-50/50 border-t border-amber-100/50">
                                            <p className="text-sm font-medium text-amber-900/70">
                                                <span className="font-bold">Notes:</span> {session.notes}
                                            </p>
                                        </div>
                                    )}
                                </Motion.article>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <Motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-sky-50/50"
                >
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-slate-950 flex items-center justify-center text-lime-300 mb-6">
                        <CalendarIcon className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900">No sessions yet</h3>
                    <p className="text-slate-600 font-medium mt-2 max-w-md mx-auto">
                        Book a coach to see your sessions here.
                    </p>
                    <Link to="/coaches" className="inline-block mt-8">
                        <Button className="px-10 h-14 rounded-2xl font-bold bg-slate-950 text-white gap-2">
                            Find a coach
                            <ArrowRightIcon className="h-5 w-5" />
                        </Button>
                    </Link>
                </Motion.div>
            )}
        </div>
    );
};

export default MySessions;
