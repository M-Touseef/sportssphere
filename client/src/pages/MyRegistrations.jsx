import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import tournamentService from '../services/tournamentService';
import {
    payForTournamentRegistration,
    getPaymentConfig,
    getPayButtonLabel,
    getPayButtonHint
} from '../services/paymentService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import {
    TrophyIcon,
    CalendarIcon,
    MapPinIcon,
    ChevronRightIcon,
    BanknotesIcon,
    SparklesIcon,
    ShieldCheckIcon,
    ClockIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

const CATEGORY_LABELS = {
    mens_singles: "Men's Singles",
    womens_singles: "Women's Singles",
    mens_doubles: "Men's Doubles",
    womens_doubles: "Women's Doubles",
    mixed_doubles: 'Mixed Doubles',
    junior_boys: 'Junior Boys',
    junior_girls: 'Junior Girls'
};

const REG_STATUS = {
    pending: {
        label: 'Pending',
        badge: 'bg-amber-100 text-amber-900 border-amber-200',
        stripe: 'from-amber-400 to-amber-600'
    },
    confirmed: {
        label: 'Confirmed',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        stripe: 'from-emerald-500 to-teal-600'
    },
    withdrawn: {
        label: 'Withdrawn',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
        stripe: 'from-rose-500 to-red-600'
    },
    completed: {
        label: 'Completed',
        badge: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        stripe: 'from-indigo-600 to-violet-700'
    }
};

const PAY_STATUS = {
    paid: { label: 'Paid', badge: 'bg-emerald-600/95 text-white border-emerald-400/40' },
    pending: { label: 'Payment due', badge: 'bg-amber-500/95 text-white border-amber-300/40' },
    failed: { label: 'Failed', badge: 'bg-rose-600/95 text-white border-rose-300/40' },
    refunded: { label: 'Refunded', badge: 'bg-slate-600/90 text-white border-slate-400/30' }
};

const formatCategory = (category) =>
    CATEGORY_LABELS[category] || category?.replace(/_/g, ' ') || 'Category';

const formatDate = (date) => {
    if (!date) return 'Date TBA';
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const MyRegistrations = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);
    const [mockMode, setMockMode] = useState(false);
    const { error: toastError, success: toastSuccess } = useToast();

    useEffect(() => {
        fetchRegistrations();
        getPaymentConfig()
            .then((cfg) => setMockMode(Boolean(cfg?.mockMode)))
            .catch(() => {});
    }, []);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const data = await tournamentService.getMyRegistrations();
            setRegistrations(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            console.error('Error fetching registrations:', err);
            toastError('Could not load your tournament entries.');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = registrations.length;
        const unpaid = registrations.filter((r) => r.paymentStatus !== 'paid').length;
        const confirmed = registrations.filter((r) => r.status === 'confirmed').length;
        return { total, unpaid, confirmed };
    }, [registrations]);

    const handlePay = async (regId) => {
        setPayingId(regId);
        try {
            const result = await payForTournamentRegistration(regId);
            if (result?.completed) {
                toastSuccess('Payment recorded successfully.');
                fetchRegistrations();
            }
        } catch (err) {
            console.error(err);
            toastError(err?.response?.data?.error || err?.message || 'Payment failed.');
        } finally {
            setPayingId(null);
        }
    };

    return (
        <div className="pb-24">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.75rem] mb-10 sm:mb-12 border border-amber-200/60 shadow-[0_24px_70px_-28px_rgba(30,27,75,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900" />
                <div className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fbbf24\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M20 20h20v20H20V20zm-20 0h20v20H0V20z\'/%3E%3C/g%3E%3C/svg%3E')]" />

                <div className="relative px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 backdrop-blur-md border border-amber-300/30 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-100 mb-5">
                                <TrophyIcon className="h-4 w-4 text-amber-300" />
                                Your entries
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                                Tournament
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300">
                                    registrations
                                </span>
                            </h1>
                            <p className="mt-4 text-base sm:text-lg text-indigo-100/85 font-medium leading-relaxed max-w-xl">
                                Track entry status, venue details, and complete fees for events you have joined.
                            </p>
                        </div>

                        {!loading && (
                            <div className="flex flex-wrap gap-3 lg:justify-end">
                                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-5 py-4 min-w-[6.5rem]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100/70">Entries</p>
                                    <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
                                </div>
                                <div className="rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-300/25 px-5 py-4 min-w-[6.5rem]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/80">Confirmed</p>
                                    <p className="text-2xl font-black text-white mt-1">{stats.confirmed}</p>
                                </div>
                                <div className="rounded-2xl bg-amber-500/25 backdrop-blur-md border border-amber-300/30 px-5 py-4 min-w-[6.5rem]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100">Due</p>
                                    <p className="text-2xl font-black text-white mt-1">{stats.unpaid}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            ) : registrations.length === 0 ? (
                <Motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 sm:py-20 rounded-[2rem] border border-amber-100/80 bg-gradient-to-br from-amber-50/80 via-white to-indigo-50/40 shadow-[0_20px_50px_-24px_rgba(30,27,75,0.12)]"
                >
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-indigo-950 flex items-center justify-center text-amber-300 shadow-lg shadow-indigo-200/50 mb-6">
                        <TrophyIcon className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">No entries yet</h3>
                    <p className="text-slate-600 font-medium mt-3 max-w-md mx-auto">
                        Browse upcoming championships and register for your category to see them here.
                    </p>
                    <Link to="/tournaments" className="inline-block mt-8">
                        <Button className="px-10 h-14 font-bold rounded-2xl bg-indigo-950 hover:bg-indigo-900 text-amber-50 shadow-lg shadow-indigo-900/20">
                            Browse tournaments
                            <ArrowRightIcon className="h-5 w-5 ml-2 inline" />
                        </Button>
                    </Link>
                </Motion.div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    <AnimatePresence mode="popLayout">
                        {registrations.map((reg, index) => {
                            const regStatus = REG_STATUS[reg.status] || REG_STATUS.pending;
                            const payStatus = PAY_STATUS[reg.paymentStatus] || PAY_STATUS.pending;
                            const isPaid = reg.paymentStatus === 'paid';
                            const tournamentId = reg.tournament?._id;

                            return (
                                <Motion.article
                                    key={reg._id}
                                    layout
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative bg-white rounded-[1.75rem] sm:rounded-[2rem] border border-amber-100/90 shadow-[0_16px_48px_-20px_rgba(30,27,75,0.15)] overflow-hidden hover:shadow-[0_24px_56px_-20px_rgba(30,27,75,0.22)] hover:border-amber-200/90 transition-all duration-300"
                                >
                                    <div
                                        className={twMerge(
                                            'absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b',
                                            regStatus.stripe
                                        )}
                                    />

                                    {/* Card header */}
                                    <div className="relative px-6 sm:px-8 pt-7 pb-5 border-b border-amber-50/80 bg-gradient-to-br from-slate-50/50 to-amber-50/30">
                                        <div className="flex items-start justify-between gap-4 pl-2">
                                            <div className="flex items-start gap-4 min-w-0 flex-1">
                                                <div className="h-12 w-12 shrink-0 rounded-xl bg-indigo-950 flex items-center justify-center text-amber-300 shadow-md border border-indigo-800">
                                                    <TrophyIcon className="h-6 w-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight truncate group-hover:text-indigo-950 transition-colors">
                                                        {reg.tournament?.name || 'Tournament'}
                                                    </h3>
                                                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-amber-800/90">
                                                        <SparklesIcon className="h-4 w-4 text-amber-600 shrink-0" />
                                                        {formatCategory(reg.category)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <span
                                                    className={twMerge(
                                                        'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                                                        regStatus.badge
                                                    )}
                                                >
                                                    {regStatus.label}
                                                </span>
                                                <span
                                                    className={twMerge(
                                                        'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                                                        payStatus.badge
                                                    )}
                                                >
                                                    {payStatus.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="px-6 sm:px-8 py-6 space-y-3 pl-8">
                                        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-50 to-amber-50/50 border border-amber-100/60 px-4 py-3">
                                            <CalendarIcon className="h-5 w-5 text-indigo-800 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/60">Event date</p>
                                                <p className="text-sm font-bold text-slate-900">{formatDate(reg.tournament?.startDate)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-50 to-amber-50/50 border border-amber-100/60 px-4 py-3">
                                            <MapPinIcon className="h-5 w-5 text-indigo-800 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/60">Venue</p>
                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                    {[reg.tournament?.venue, reg.tournament?.city].filter(Boolean).join(', ') || 'TBA'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-indigo-950/5 to-amber-50 border border-indigo-100/50 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <BanknotesIcon className="h-5 w-5 text-amber-700 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/60">Entry fee</p>
                                                    <p className="text-lg font-black text-slate-900 tracking-tight">
                                                        Rs. {reg.paymentAmount?.toLocaleString?.() ?? reg.paymentAmount ?? '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            {!isPaid && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                                                    <ClockIcon className="h-3.5 w-3.5" />
                                                    Due
                                                </span>
                                            )}
                                            {isPaid && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                    <ShieldCheckIcon className="h-3.5 w-3.5" />
                                                    Settled
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="px-6 sm:px-8 pb-7 pl-8 flex flex-col sm:flex-row gap-3">
                                        {tournamentId && (
                                            <Link
                                                to={`/tournaments/${tournamentId}`}
                                                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 text-sm font-bold hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-950 transition-all"
                                            >
                                                View details
                                                <ChevronRightIcon className="h-4 w-4" />
                                            </Link>
                                        )}
                                        {!isPaid ? (
                                            <button
                                                type="button"
                                                disabled={payingId === reg._id}
                                                onClick={() => handlePay(reg._id)}
                                                className="flex-1 py-3 px-4 rounded-xl bg-indigo-950 text-amber-50 text-sm font-bold hover:bg-indigo-900 disabled:opacity-60 shadow-lg shadow-indigo-900/20 transition-all border-b-4 border-indigo-800 active:border-b-0 active:translate-y-0.5"
                                                title={getPayButtonHint(mockMode)}
                                            >
                                                {payingId === reg._id ? 'Processing…' : getPayButtonLabel(mockMode)}
                                            </button>
                                        ) : (
                                            tournamentId && (
                                                <Link
                                                    to={`/tournaments/${tournamentId}/brackets`}
                                                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-indigo-950 text-sm font-bold hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-200/50 transition-all border-b-4 border-amber-700 active:border-b-0"
                                                >
                                                    View draws
                                                    <ChevronRightIcon className="h-4 w-4" />
                                                </Link>
                                            )
                                        )}
                                    </div>
                                </Motion.article>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default MyRegistrations;
