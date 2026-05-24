import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { getCoachProfile } from '../services/coachService';
import sessionService from '../services/sessionService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import {
    MapPinIcon,
    AcademicCapIcon,
    CurrencyDollarIcon,
    ArrowLeftIcon,
    CheckBadgeIcon,
    ClockIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { formatSlotHourRange } from '../utils/timeFormat';

const BOOKING_STEPS = [
    { id: 1, label: 'Date' },
    { id: 2, label: 'Time' },
    { id: 3, label: 'Confirm' }
];

const SPEC_LABELS = {
    singles: 'Singles',
    doubles: 'Doubles',
    mixed_doubles: 'Mixed doubles',
    junior_coaching: 'Junior',
    fitness: 'Fitness',
    technique: 'Technique',
    strategy: 'Strategy',
    performance_analysis: 'Analysis',
    tactics: 'Tactics',
    high_performance: 'High performance'
};

const formatSpec = (spec) => SPEC_LABELS[spec] || spec?.replace(/_/g, ' ') || spec;

const toDateKey = (dateValue) => {
    const d = new Date(dateValue);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().split('T')[0];
};

const formatDateChip = (dateKey) => {
    const d = new Date(dateKey + 'T12:00:00');
    return {
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
};

/** Strip any student/requester fields — players must not see other bookers' names */
const sanitizePublicSlots = (slots) =>
    (Array.isArray(slots) ? slots : []).map(({ students, requester, booker, bookedBy, ...slot }) => slot);

const getSlotAvailabilityLabel = (slot) => {
    if (slot.slotStatus === 'your_pending') return 'Your request pending';
    const max = slot.maxStudents ?? 1;
    if (slot.isGroup && max > 1) {
        const spots = max - (slot.enrolledCount ?? 0);
        return spots > 0 ? `${spots} spots left` : 'Full';
    }
    return 'Available';
};

const StepBar = ({ current }) => (
    <div className="flex items-center w-full">
        {BOOKING_STEPS.map((s, i) => {
            const done = current > s.id;
            const active = current === s.id;
            return (
                <div key={s.id} className={twMerge('flex items-center', i < BOOKING_STEPS.length - 1 && 'flex-1')}>
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div
                            className={twMerge(
                                'h-9 w-9 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors',
                                done && 'bg-emerald-600 border-emerald-600 text-white',
                                active && !done && 'bg-indigo-950 border-indigo-950 text-amber-100',
                                !done && !active && 'bg-white border-slate-200 text-slate-400'
                            )}
                        >
                            {done ? <CheckIcon className="h-5 w-5" /> : s.id}
                        </div>
                        <span
                            className={twMerge(
                                'text-[10px] font-bold uppercase tracking-wider hidden sm:block',
                                active ? 'text-indigo-950' : 'text-slate-400'
                            )}
                        >
                            {s.label}
                        </span>
                    </div>
                    {i < BOOKING_STEPS.length - 1 && (
                        <div
                            className={twMerge(
                                'h-0.5 flex-1 mx-2 sm:mx-3 rounded-full',
                                current > s.id ? 'bg-emerald-500' : 'bg-slate-200'
                            )}
                        />
                    )}
                </div>
            );
        })}
    </div>
);

const CoachProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { success, error: toastError } = useToast();

    const [coach, setCoach] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [selectedDateKey, setSelectedDateKey] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [paymentPlan, setPaymentPlan] = useState('hourly');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState('');
    const [showAbout, setShowAbout] = useState(false);
    const [bookingDone, setBookingDone] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, sessionsRes] = await Promise.all([
                    getCoachProfile(id),
                    sessionService.getCoachRealizedAvailability(id)
                ]);
                setCoach(profileRes.data);
                setAvailability(sanitizePublicSlots(sessionsRes.data));
            } catch (error) {
                console.error('Error fetching coach details:', error);
                toastError('Failed to load coach profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const openSlots = useMemo(
        () =>
            availability.filter((slot) => {
                if (slot.slotStatus === 'your_pending') return true;
                const max = slot.maxStudents ?? 1;
                if (max <= 1 || !slot.isGroup) return true;
                return max - (slot.enrolledCount ?? 0) > 0;
            }),
        [availability]
    );

    const slotsByDate = useMemo(() => {
        const map = new Map();
        for (const slot of openSlots) {
            const key = toDateKey(slot.date);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(slot);
        }
        for (const [, slots] of map) {
            slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        }
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [openSlots]);

    const dateKeys = useMemo(() => slotsByDate.map(([key]) => key), [slotsByDate]);

    const slotsForSelectedDate = useMemo(() => {
        if (!selectedDateKey) return [];
        return slotsByDate.find(([key]) => key === selectedDateKey)?.[1] ?? [];
    }, [slotsByDate, selectedDateKey]);

    const selectionSummary = useMemo(() => {
        if (!selectedSlot || !selectedDateKey) return null;
        const { weekday, day } = formatDateChip(selectedDateKey);
        return `${weekday}, ${day} · ${formatSlotHourRange(selectedSlot.startTime, selectedSlot.endTime)}`;
    }, [selectedSlot, selectedDateKey]);

    const resetBooking = () => {
        setStep(1);
        setSelectedDateKey(null);
        setSelectedSlot(null);
        setPaymentPlan('hourly');
        setBookingMessage('');
        setBookingDone(false);
    };

    const goBack = () => {
        if (step === 3) {
            setStep(2);
            return;
        }
        if (step === 2) {
            setSelectedSlot(null);
            setStep(1);
        }
    };

    const continueFromDate = () => {
        if (!selectedDateKey) {
            toastError('Please pick a date.');
            return;
        }
        setSelectedSlot(null);
        setStep(2);
    };

    const continueFromTime = () => {
        if (!selectedSlot) {
            toastError('Please pick a time slot.');
            return;
        }
        if (selectedSlot.slotStatus === 'your_pending') {
            toastError('You already sent a request for this time. Check My Sessions for updates.');
            return;
        }
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/coaches/${id}` } });
            return;
        }
        setStep(3);
    };

    const handleBooking = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/coaches/${id}` } });
            return;
        }
        if (!selectedSlot) {
            toastError('Please select a time slot.');
            return;
        }

        const coachUserId =
            coach?.user && typeof coach.user === 'object'
                ? coach.user._id
                : typeof coach?.user === 'string'
                  ? coach.user
                  : null;

        if (!coachUserId) {
            toastError('This coach cannot accept bookings right now.');
            return;
        }

        try {
            setBookingLoading(true);
            await sessionService.requestRecurringSession({
                coachId: coachUserId,
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                courtId: selectedSlot.court?._id,
                planType: paymentPlan,
                message: bookingMessage
            });

            success('Request sent! The coach has 30 minutes to confirm.');
            const bookedKey = `${toDateKey(selectedSlot.date)}-${selectedSlot.startTime}`;
            setAvailability((prev) =>
                prev.map((s) => {
                    const key = `${toDateKey(s.date)}-${s.startTime}`;
                    if (key !== bookedKey) return s;
                    return { ...s, slotStatus: 'your_pending', enrolledCount: 0 };
                })
            );
            setBookingDone(true);
        } catch (error) {
            console.error(error);
            toastError(error.response?.data?.error || 'Request failed.');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[50vh] gap-4">
                <div className="h-14 w-14 border-4 border-amber-200 border-t-indigo-900 rounded-full animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading coach…</p>
            </div>
        );
    }

    const coachUser = coach?.user && typeof coach.user === 'object' ? coach.user : null;
    const displayName = coachUser?.name || 'Coach';
    const displayCity = coachUser?.city || coach?.location?.city || '—';
    const specializations = Array.isArray(coach?.specialization) ? coach.specialization : [];
    const hasMonthly = coach?.monthlyFee != null && coach.monthlyFee > 0;
    const totalPrice = paymentPlan === 'hourly' ? coach?.hourlyRate : coach?.monthlyFee;

    if (!coach || !coachUser) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-24 text-center">
                <AcademicCapIcon className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                <h2 className="text-2xl font-extrabold text-slate-900">Profile not found</h2>
                <p className="text-slate-500 mt-2 text-sm">This coach is unavailable or no longer linked to an account.</p>
                <Link to="/coaches" className="inline-block mt-8">
                    <Button variant="outline" className="rounded-xl font-bold">Back to coaches</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="pb-16 max-w-3xl mx-auto px-4 sm:px-6">
            <Link
                to="/coaches"
                className="inline-flex items-center gap-2 text-sm font-bold text-indigo-900/70 hover:text-indigo-950 mb-5"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Coaches
            </Link>

            {/* Compact coach header */}
            <div className="flex gap-4 mb-6 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-indigo-950 text-amber-100 flex items-center justify-center text-2xl font-black">
                    {displayName[0]?.toUpperCase() || 'C'}
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-black text-slate-900 truncate">{displayName}</h1>
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {displayCity}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs font-bold">
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                            {coach.experience} yrs
                        </span>
                        <span className="text-indigo-950">
                            Rs.{coach.hourlyRate?.toLocaleString?.() ?? coach.hourlyRate}/hr
                        </span>
                        {hasMonthly && (
                            <span className="text-emerald-800">
                                · Rs.{coach.monthlyFee?.toLocaleString?.() ?? coach.monthlyFee}/mo
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking wizard */}
            <section className="rounded-[1.75rem] border-2 border-amber-200/80 bg-white shadow-lg overflow-hidden mb-8">
                <div className="px-5 sm:px-8 py-5 border-b border-amber-50 bg-amber-50/40">
                    <p className="text-sm font-black text-indigo-950 mb-4">Book a session</p>
                    <StepBar current={step} />
                </div>

                <div className="p-5 sm:p-8 min-h-[260px] flex flex-col">
                    {bookingDone ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-6">
                            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckBadgeIcon className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900">Request sent</h2>
                            <p className="text-sm text-slate-500 max-w-xs">
                                {displayName} has 30 minutes to accept. You will be notified when they respond.
                            </p>
                            <div className="flex gap-3 w-full max-w-sm mt-2">
                                <Button variant="outline" onClick={resetBooking} className="flex-1 h-12 rounded-xl font-bold">
                                    Book another
                                </Button>
                                <Link to="/app/sessions" className="flex-1">
                                    <Button className="w-full h-12 rounded-xl font-bold bg-indigo-950 text-amber-50">
                                        My sessions
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="date"
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        className="flex-1 flex flex-col gap-4"
                                    >
                                        {dateKeys.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {slotsByDate.map(([dateKey, slots]) => {
                                                    const { weekday, day } = formatDateChip(dateKey);
                                                    const selected = selectedDateKey === dateKey;
                                                    return (
                                                        <button
                                                            key={dateKey}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedDateKey(dateKey);
                                                                setSelectedSlot(null);
                                                            }}
                                                            className={twMerge(
                                                                'p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98]',
                                                                selected
                                                                    ? 'bg-indigo-950 border-indigo-950 text-amber-50'
                                                                    : 'border-amber-100 hover:border-amber-400 bg-white'
                                                            )}
                                                        >
                                                            <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">
                                                                {weekday}
                                                            </span>
                                                            <span className="block text-base font-black mt-0.5">{day}</span>
                                                            <span
                                                                className={twMerge(
                                                                    'block text-[10px] font-bold mt-2',
                                                                    selected ? 'text-amber-200' : 'text-slate-500'
                                                                )}
                                                            >
                                                                {slots.length} slot{slots.length !== 1 ? 's' : ''}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="py-14 text-center rounded-2xl border-2 border-dashed border-amber-200">
                                                <ClockIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                                <p className="font-bold text-slate-700">No open slots</p>
                                                <p className="text-sm text-slate-500 mt-1">Check back later or try another coach.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="time"
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        className="flex-1 flex flex-col gap-4"
                                    >
                                        {selectedDateKey && (
                                            <p className="text-sm font-black text-indigo-950 text-center">
                                                {formatDateChip(selectedDateKey).weekday},{' '}
                                                {formatDateChip(selectedDateKey).day}
                                            </p>
                                        )}
                                        {slotsForSelectedDate.length > 0 ? (
                                            <div className="space-y-2">
                                                {slotsForSelectedDate.map((slot) => {
                                                    const isOwnPending = slot.slotStatus === 'your_pending';
                                                    const selected = selectedSlot?._id === slot._id;
                                                    const statusLabel = getSlotAvailabilityLabel(slot);
                                                    return (
                                                        <button
                                                            key={slot._id}
                                                            type="button"
                                                            disabled={isOwnPending}
                                                            onClick={() => setSelectedSlot(slot)}
                                                            className={twMerge(
                                                                'w-full flex items-center justify-between gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.99]',
                                                                isOwnPending && 'opacity-80 cursor-default',
                                                                selected
                                                                    ? 'bg-indigo-950 border-indigo-950 text-amber-50'
                                                                    : 'border-amber-100 hover:border-amber-400 bg-white'
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <ClockIcon
                                                                    className={twMerge(
                                                                        'h-5 w-5 shrink-0',
                                                                        selected ? 'text-amber-200' : 'text-indigo-600'
                                                                    )}
                                                                />
                                                                <span className="font-black text-base">
                                                                    {formatSlotHourRange(slot.startTime, slot.endTime)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {slot.court?.name && (
                                                                    <span
                                                                        className={twMerge(
                                                                            'text-[10px] font-bold px-2 py-1 rounded-lg max-w-[7rem] truncate',
                                                                            selected
                                                                                ? 'bg-indigo-800 text-amber-100'
                                                                                : 'bg-slate-100 text-slate-600'
                                                                        )}
                                                                    >
                                                                        {slot.court.name}
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className={twMerge(
                                                                        'text-[10px] font-bold px-2 py-1 rounded-lg',
                                                                        isOwnPending &&
                                                                            (selected
                                                                                ? 'bg-amber-500 text-indigo-950'
                                                                                : 'bg-amber-100 text-amber-900'),
                                                                        !isOwnPending &&
                                                                            selected &&
                                                                            'bg-emerald-700 text-white',
                                                                        !isOwnPending &&
                                                                            !selected &&
                                                                            'bg-emerald-50 text-emerald-700'
                                                                    )}
                                                                >
                                                                    {statusLabel}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center text-sm font-bold text-slate-500">
                                                No times for this date
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="confirm"
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        className="flex-1 flex flex-col gap-5"
                                    >
                                        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 space-y-3">
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-slate-500">When</span>
                                                <span className="text-slate-900 text-right">{selectionSummary}</span>
                                            </div>
                                            {selectedSlot?.court?.name && (
                                                <div className="flex justify-between text-sm font-bold">
                                                    <span className="text-slate-500">Venue</span>
                                                    <span className="text-slate-900">{selectedSlot.court.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {hasMonthly && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentPlan('hourly')}
                                                    className={twMerge(
                                                        'p-4 rounded-2xl border-2 text-left transition-all',
                                                        paymentPlan === 'hourly'
                                                            ? 'border-indigo-950 bg-indigo-950/5'
                                                            : 'border-amber-100'
                                                    )}
                                                >
                                                    <p className="text-[10px] font-bold uppercase text-slate-500">Per session</p>
                                                    <p className="text-lg font-black text-indigo-950 mt-1">
                                                        Rs.{coach.hourlyRate?.toLocaleString?.() ?? coach.hourlyRate}
                                                    </p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentPlan('monthly')}
                                                    className={twMerge(
                                                        'p-4 rounded-2xl border-2 text-left transition-all',
                                                        paymentPlan === 'monthly'
                                                            ? 'border-indigo-950 bg-indigo-950/5'
                                                            : 'border-amber-100'
                                                    )}
                                                >
                                                    <p className="text-[10px] font-bold uppercase text-slate-500">Monthly</p>
                                                    <p className="text-lg font-black text-emerald-800 mt-1">
                                                        Rs.{coach.monthlyFee?.toLocaleString?.() ?? coach.monthlyFee}
                                                    </p>
                                                </button>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                                                Message (optional)
                                            </label>
                                            <textarea
                                                value={bookingMessage}
                                                onChange={(e) => setBookingMessage(e.target.value)}
                                                placeholder="Goals, level, or questions for the coach…"
                                                className="mt-2 w-full p-4 rounded-xl border-2 border-amber-100 text-sm font-medium focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none h-24 resize-none"
                                            />
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t border-amber-50">
                                            <span className="text-xs font-bold uppercase text-slate-500">Estimated</span>
                                            <span className="text-2xl font-black text-indigo-950">
                                                Rs.{totalPrice?.toLocaleString?.() ?? totalPrice}
                                            </span>
                                        </div>

                                        <Button
                                            onClick={handleBooking}
                                            isLoading={bookingLoading}
                                            fullWidth
                                            className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                        >
                                            Send booking request
                                        </Button>
                                        <p className="text-[11px] text-center text-slate-500 font-medium">
                                            Coach has 30 minutes to confirm before the request expires.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {step < 3 && dateKeys.length > 0 && (
                                <div className="flex gap-3 mt-8 pt-6 border-t border-amber-50">
                                    {step > 1 && (
                                        <Button variant="outline" onClick={goBack} className="flex-1 h-12 rounded-xl font-bold">
                                            Back
                                        </Button>
                                    )}
                                    {step === 1 && (
                                        <Button
                                            onClick={continueFromDate}
                                            disabled={!selectedDateKey}
                                            className="flex-1 h-12 rounded-xl font-bold bg-indigo-950 text-amber-50"
                                        >
                                            Choose time
                                            <ChevronRightIcon className="h-5 w-5 ml-1 inline" />
                                        </Button>
                                    )}
                                    {step === 2 && (
                                        <Button
                                            onClick={continueFromTime}
                                            disabled={!selectedSlot}
                                            className="flex-1 h-12 rounded-xl font-bold bg-indigo-950 text-amber-50"
                                        >
                                            Review & send
                                            <ChevronRightIcon className="h-5 w-5 ml-1 inline" />
                                        </Button>
                                    )}
                                </div>
                            )}

                            {step === 3 && !bookingDone && (
                                <div className="mt-4 pt-4 border-t border-amber-50">
                                    <Button variant="outline" onClick={goBack} fullWidth className="h-11 rounded-xl font-bold">
                                        Back
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* About — collapsed */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowAbout((v) => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 font-bold text-slate-800 hover:bg-slate-50"
                >
                    About {displayName}
                    <ChevronRightIcon className={twMerge('h-5 w-5 transition-transform', showAbout && 'rotate-90')} />
                </button>
                {showAbout && (
                    <div className="px-5 pb-6 border-t border-slate-100 space-y-5 pt-4">
                        <p className="text-slate-600 text-sm leading-relaxed">{coach.bio || '—'}</p>
                        {specializations.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {specializations.map((spec, index) => (
                                    <span
                                        key={index}
                                        className="text-xs font-bold bg-indigo-50 text-indigo-900 px-3 py-1.5 rounded-lg"
                                    >
                                        {formatSpec(spec)}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 text-sm font-bold">
                            <div className="rounded-xl bg-slate-50 p-3">
                                <span className="text-slate-400 text-[10px] uppercase block mb-1">Experience</span>
                                {coach.experience} years
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3 flex items-start gap-2">
                                <CurrencyDollarIcon className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase block mb-1">Rates</span>
                                    Rs.{coach.hourlyRate}/hr
                                    {hasMonthly && ` · Rs.${coach.monthlyFee}/mo`}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoachProfile;
