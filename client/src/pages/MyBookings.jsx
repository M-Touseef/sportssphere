import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import courtService from '../services/courtService';
import { useToast } from '../context/ToastContext';
import { payForBooking, getPayButtonLabel, getPaymentConfig } from '../services/paymentService';
import { formatSlotHourRange } from '../utils/timeFormat';
import {
    CalendarIcon,
    MapPinIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ChevronRightIcon,
    BuildingOffice2Icon,
    ShieldCheckIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
const BOOKING_STATUS = {
    confirmed: {
        label: 'Confirmed',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        stripe: 'from-emerald-500 to-teal-600'
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
    pending_pro: {
        label: 'Awaiting pro',
        badge: 'bg-violet-100 text-violet-900 border-violet-200',
        stripe: 'from-violet-500 to-indigo-600'
    },
    cancelled: {
        label: 'Cancelled',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
        stripe: 'from-rose-500 to-red-600'
    },
    completed: {
        label: 'Completed',
        badge: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        stripe: 'from-indigo-600 to-violet-700'
    }
};

const formatBookingDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const MyBookings = () => {
    const { error, success } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [payingBookingId, setPayingBookingId] = useState(null);
    const [mockMode, setMockMode] = useState(false);

    useEffect(() => {
        fetchBookings();
        getPaymentConfig()
            .then((cfg) => setMockMode(Boolean(cfg?.mockMode)))
            .catch(() => {});
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setFetchError(false);
            const data = await courtService.getMyBookings();
            const list = Array.isArray(data?.data) ? data.data : [];
            setBookings(
                list.map((b) => ({
                    id: b._id,
                    courtId: b.court?._id,
                    court: b.court?.name || 'Court',
                    location: b.court?.location?.address || b.court?.location?.city || '—',
                    city: b.court?.location?.city,
                    dateRaw: b.date,
                    date: formatBookingDate(b.date),
                    time: b.startTime,
                    endTime: b.endTime,
                    price: b.totalPrice,
                    status: b.status,
                    paymentStatus: b.paymentStatus
                }))
            );
        } catch (err) {
            setFetchError(true);
            error('Could not load your bookings.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePayNow = async (bookingId) => {
        try {
            setPayingBookingId(bookingId);
            const result = await payForBooking(bookingId);
            if (result?.completed) {
                success('Payment confirmed.');
                await fetchBookings();
            }
        } catch (err) {
            const msg = err?.response?.data?.error || 'Payment failed. Try again.';
            error(msg);
        } finally {
            setPayingBookingId(null);
        }
    };

    const stats = useMemo(() => {
        const paid = bookings.filter((b) => b.paymentStatus === 'paid').length;
        const due = bookings.filter(
            (b) => b.paymentStatus !== 'paid' && b.status === 'pending_payment'
        ).length;
        return { total: bookings.length, paid, due };
    }, [bookings]);

    return (
        <div className="pb-32">
            <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.75rem] mb-10 sm:mb-12 border border-amber-200/60 shadow-[0_24px_70px_-28px_rgba(30,27,75,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-teal-900" />
                <div className="absolute -top-16 -right-8 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="relative px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 border border-amber-300/30 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-100 mb-5">
                                <CalendarIcon className="h-4 w-4 text-amber-300" />
                                Your schedule
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                                Court
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-teal-200">
                                    bookings
                                </span>
                            </h1>
                            <p className="mt-4 text-base sm:text-lg text-indigo-100/85 font-medium max-w-xl">
                                Upcoming sessions, payments, and venue details in one place.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 lg:justify-end items-center">
                            {!loading && !fetchError && (
                                <>
                                    <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 px-5 py-4 min-w-[5.5rem]">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100/70">Total</p>
                                        <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
                                    </div>
                                    <div className="rounded-2xl bg-emerald-500/20 backdrop-blur border border-emerald-300/25 px-5 py-4 min-w-[5.5rem]">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/80">Paid</p>
                                        <p className="text-2xl font-black text-white mt-1">{stats.paid}</p>
                                    </div>
                                    {stats.due > 0 && (
                                        <div className="rounded-2xl bg-amber-500/25 backdrop-blur border border-amber-300/30 px-5 py-4 min-w-[5.5rem]">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100">Due</p>
                                            <p className="text-2xl font-black text-white mt-1">{stats.due}</p>
                                        </div>
                                    )}
                                </>
                            )}
                            <Link to="/courts">
                                <Button className="h-12 px-6 rounded-2xl font-bold bg-amber-400 hover:bg-amber-300 text-indigo-950 shadow-lg">
                                    Book a court
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {loading ? (
                <CardSkeleton count={4} />
            ) : fetchError ? (
                <div className="flex flex-col items-center p-12 rounded-[2rem] border-2 border-dashed border-amber-200 bg-amber-50/30 text-center gap-6">
                    <ExclamationTriangleIcon className="h-12 w-12 text-amber-700" />
                    <p className="text-lg font-bold text-slate-800">Could not load bookings</p>
                    <Button onClick={fetchBookings} className="bg-indigo-950 text-amber-50 rounded-2xl px-8 font-bold">
                        Retry
                    </Button>
                </div>
            ) : bookings.length > 0 ? (
                <div className="grid gap-6 sm:gap-8">
                    <AnimatePresence mode="popLayout">
                        {bookings.map((booking, index) => {
                            const statusCfg =
                                BOOKING_STATUS[booking.status] || BOOKING_STATUS.pending;
                            const isPaid = booking.paymentStatus === 'paid';
                            const needsPay = booking.status === 'pending_payment' && !isPaid;
                            const timeLabel = formatSlotHourRange(booking.time, booking.endTime);

                            return (
                                <motion.article
                                    key={booking.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="group relative bg-white rounded-[1.75rem] sm:rounded-[2rem] border border-amber-100/90 shadow-[0_16px_48px_-20px_rgba(30,27,75,0.12)] overflow-hidden hover:shadow-[0_24px_56px_-20px_rgba(30,27,75,0.18)] transition-all"
                                >
                                    <div
                                        className={twMerge(
                                            'absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b',
                                            statusCfg.stripe
                                        )}
                                    />

                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6 p-6 sm:p-8 pl-8">
                                        <div className="flex gap-4 flex-1 min-w-0">
                                            <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl bg-indigo-950 flex items-center justify-center text-amber-200 shadow-md">
                                                <BuildingOffice2Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">
                                                        {booking.court}
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
                                                    <MapPinIcon className="h-4 w-4 text-amber-700 shrink-0" />
                                                    {booking.location}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-950 bg-gradient-to-r from-slate-50 to-amber-50/60 border border-amber-100 px-3 py-2 rounded-xl">
                                                        <CalendarIcon className="h-4 w-4 text-indigo-800" />
                                                        {booking.date}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-950 bg-gradient-to-r from-slate-50 to-amber-50/60 border border-amber-100 px-3 py-2 rounded-xl">
                                                        <ClockIcon className="h-4 w-4 text-indigo-800" />
                                                        {timeLabel}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-xs font-black text-indigo-950 bg-indigo-950/5 border border-indigo-100 px-3 py-2 rounded-xl">
                                                        Rs.{booking.price?.toLocaleString?.() ?? booking.price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-44">
                                            {needsPay && (
                                                <Button
                                                    onClick={() => handlePayNow(booking.id)}
                                                    disabled={payingBookingId === booking.id}
                                                    isLoading={payingBookingId === booking.id}
                                                    className="h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                                                >
                                                    {getPayButtonLabel(mockMode)}
                                                </Button>
                                            )}
                                            {booking.courtId ? (
                                                <Link to={`/courts/${booking.courtId}`} className="block">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-11 rounded-xl font-bold border-amber-200 text-indigo-950 hover:bg-indigo-950 hover:text-amber-50 gap-1"
                                                    >
                                                        View court
                                                        <ChevronRightIcon className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    disabled
                                                    className="w-full h-11 rounded-xl font-bold border-slate-200 text-slate-400"
                                                >
                                                    View court
                                                </Button>
                                            )}
                                        </div>
                                    </div>
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
                        <CalendarIcon className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900">No bookings yet</h3>
                    <p className="text-slate-600 font-medium mt-2 max-w-md mx-auto">
                        Reserve a court to see your sessions here.
                    </p>
                    <Link to="/courts" className="inline-block mt-8">
                        <Button className="px-10 h-14 rounded-2xl font-bold bg-indigo-950 text-amber-50 gap-2">
                            Find courts
                            <ArrowRightIcon className="h-5 w-5" />
                        </Button>
                    </Link>
                </motion.div>
            )}
        </div>
    );
};

export default MyBookings;
