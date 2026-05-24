import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import courtService from '../services/courtService';
import { formatSlotHour } from '../utils/timeFormat';
import { payForBooking, getPaymentConfig, getPayButtonLabel, getPayButtonHint } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import {
    MapPinIcon,
    TableCellsIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    PencilSquareIcon,
    BuildingOffice2Icon,
    UserIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import ProSelectionList from '../components/booking/ProSelectionList';

const SURFACE_LABELS = {
    synthetic: 'Mat / Synthetic',
    wooden: 'Wooden floor',
    cement: 'Cement floor',
    acrylic: 'Hard court'
};

const formatSurface = (type) => SURFACE_LABELS[type] || type || 'Standard';

const STEPS_PLAYER = [
    { id: 1, label: 'Date & time' },
    { id: 2, label: 'Booking type' },
    { id: 3, label: 'Confirm' }
];

const STEPS_PROFESSIONAL = [
    { id: 1, label: 'Date & time' },
    { id: 2, label: 'Confirm' }
];

const StepBar = ({ current, steps }) => (
    <div className="flex items-center w-full">
        {steps.map((s, i) => {
            const done = current > s.id;
            const active = current === s.id;
            return (
                <div key={s.id} className={twMerge('flex items-center', i < steps.length - 1 && 'flex-1')}>
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
                    {i < steps.length - 1 && (
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

const CourtDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const { success, error: toastError } = useToast();

    const [court, setCourt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [step, setStep] = useState(1);
    const [bookingMode, setBookingMode] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentMockMode, setPaymentMockMode] = useState(true);
    const [showVenueInfo, setShowVenueInfo] = useState(false);

    useEffect(() => {
        fetchCourtDetails();
    }, [id]);

    useEffect(() => {
        if (court) fetchAvailability();
    }, [selectedDate, court]);

    useEffect(() => {
        if (step !== 3 || bookingMode !== 'court') return;
        getPaymentConfig()
            .then((cfg) => setPaymentMockMode(Boolean(cfg?.mockMode)))
            .catch(() => setPaymentMockMode(true));
    }, [step, bookingMode]);

    const isProfessionalPlayer =
        user?.role === 'player' && user?.skillLevel === 'professional';

    const wizardSteps = isProfessionalPlayer ? STEPS_PROFESSIONAL : STEPS_PLAYER;

    const stepBarIndex = isProfessionalPlayer
        ? step === 3 && bookingMode === 'court'
            ? 2
            : step
        : step;

    useEffect(() => {
        if (isProfessionalPlayer) return;
        if (!location.state?.preSelectedPro || slots.length === 0) return;
        const { date, time } = location.state;
        if (date && date !== selectedDate) setSelectedDate(date);
        const targetSlot = slots.find((s) => s.time === time);
        if (targetSlot?.available) {
            setSelectedSlot(targetSlot);
            setBookingMode('pro');
            setStep(3);
        }
    }, [location.state, slots, selectedDate, isProfessionalPlayer]);

    const fetchCourtDetails = async () => {
        try {
            const data = await courtService.getCourt(id);
            setCourt(data.data);
        } catch (err) {
            console.error('Error fetching court details:', err);
            toastError('Could not load this court.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailability = async () => {
        try {
            const data = await courtService.getAvailability(id, selectedDate);
            setSlots(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            console.error('Error fetching availability:', err);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setBookingMode(null);
        setSelectedSlot(null);
        setSelectedBooking(null);
    };

    const selectionSummary = useMemo(() => {
        if (!selectedSlot) return null;
        const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        return `${dateLabel} · ${formatSlotHour(selectedSlot.time)}`;
    }, [selectedDate, selectedSlot]);

    const handleBooking = async (proData = null) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/courts/${id}` } });
            return;
        }
        if (!selectedSlot) return;

        try {
            setBookingLoading(true);
            const hours = parseInt(selectedSlot.time.split(':')[0], 10);
            const endTime = `${(hours + 1).toString().padStart(2, '0')}:00`;

            const bookingPayload = {
                courtId: id,
                date: selectedDate,
                startTime: selectedSlot.time,
                endTime
            };

            if (proData) {
                bookingPayload.proPlayerId = proData.player._id;
                if (!proData.isRecurring) bookingPayload.slotId = proData.slot?._id;
            }

            const response = await courtService.createBooking(bookingPayload);
            setSelectedBooking(response.data);

            if (proData) {
                success(`Request sent to ${proData.player.name}.`);
                resetFlow();
                fetchAvailability();
            } else {
                success('Slot reserved.');
                setBookingMode('court');
                setStep(3);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Booking failed.';
            toastError(errorMessage);
            if (errorMessage.includes('booked') || errorMessage.includes('reserved')) {
                fetchAvailability();
                setSelectedSlot(null);
                setStep(1);
            }
        } finally {
            setBookingLoading(false);
        }
    };

    const handlePayNow = async () => {
        if (!selectedBooking?._id) return;
        try {
            setPaymentLoading(true);
            const result = await payForBooking(selectedBooking._id);
            if (result?.completed) {
                success('Booking confirmed!');
                resetFlow();
                fetchAvailability();
            }
        } catch (payErr) {
            toastError(payErr?.response?.data?.error || 'Payment could not be completed.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const goBack = () => {
        if (step === 3 && bookingMode === 'court' && selectedBooking) {
            setSelectedBooking(null);
            setStep(isProfessionalPlayer ? 1 : 2);
            return;
        }
        if (step === 3) {
            setBookingMode(null);
            setStep(isProfessionalPlayer ? 1 : 2);
            return;
        }
        if (step === 2) {
            setBookingMode(null);
            setStep(1);
        }
    };

    const continueFromDateTime = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/courts/${id}` } });
            return;
        }
        if (!selectedSlot) return;
        if (isProfessionalPlayer) {
            handleBooking(null);
        } else {
            setStep(2);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[50vh] gap-4">
                <div className="h-14 w-14 border-4 border-amber-200 border-t-indigo-900 rounded-full animate-spin" />
            </div>
        );
    }

    const ownerId =
        court?.owner && (typeof court.owner === 'object' ? court.owner._id || court.owner.id : court.owner);
    const isCourtOwner =
        user && court && ownerId != null && String(ownerId) === String(user.id || user._id);

    if (!court) {
        return (
            <div className="py-20 text-center">
                <h2 className="text-2xl font-extrabold text-slate-900">Court not found</h2>
                <Link to="/courts" className="inline-block mt-8">
                    <Button className="bg-indigo-950 text-amber-50 rounded-2xl px-8">Browse courts</Button>
                </Link>
            </div>
        );
    }

    const amenities = Array.isArray(court.amenities) ? court.amenities : [];
    const hoursLabel =
        court.openingTime && court.closingTime
            ? `${formatSlotHour(court.openingTime)} – ${formatSlotHour(court.closingTime)}`
            : '—';

    return (
        <div className="pb-16 max-w-3xl mx-auto">
            {/* Nav */}
            <div className="flex items-center justify-between gap-3 mb-5">
                <Link
                    to="/courts"
                    className="inline-flex items-center gap-2 text-sm font-bold text-indigo-900/70 hover:text-indigo-950"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Courts
                </Link>
                {isCourtOwner && (
                    <div className="flex gap-2">
                        <Link
                            to={`/org/courts/${id}/edit`}
                            className="text-xs font-bold text-indigo-950 bg-amber-100 px-3 py-1.5 rounded-lg"
                        >
                            Edit
                        </Link>
                    </div>
                )}
            </div>

            {/* Compact court header */}
            <div className="flex gap-4 mb-6 rounded-2xl border border-amber-100 bg-white p-3 sm:p-4 shadow-sm">
                <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl overflow-hidden bg-indigo-950">
                    {court.images?.[0] ? (
                        <img src={court.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center">
                            <TableCellsIcon className="h-8 w-8 text-amber-400/40" />
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight truncate">{court.name}</h1>
                    <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1 truncate">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                        {court.location?.city}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                            {formatSurface(court.surfaceType)}
                        </span>
                        <span className="text-sm font-black text-indigo-950">
                            Rs.{court.pricePerHour?.toLocaleString?.() ?? court.pricePerHour}/hr
                        </span>
                    </div>
                </div>
            </div>

            {/* Booking wizard */}
            <section className="rounded-[1.75rem] border-2 border-amber-200/80 bg-white shadow-lg overflow-hidden mb-8">
                <div className="px-5 sm:px-8 py-5 border-b border-amber-50 bg-amber-50/40">
                    <StepBar current={stepBarIndex} steps={wizardSteps} />
                </div>

                <div className="p-5 sm:p-8 min-h-[280px] flex flex-col">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="s1"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                className="flex-1 flex flex-col gap-5"
                            >
                                <input
                                    id="booking-date"
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedSlot(null);
                                    }}
                                    className="w-full h-14 px-4 rounded-2xl border-2 border-amber-100 font-bold text-base focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none"
                                />

                                {slots.length > 0 ? (
                                    <div className="flex gap-2 overflow-x-auto pb-1 snap-x [scrollbar-width:thin]">
                                        {slots.map((slot) => (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                disabled={!slot.available}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={twMerge(
                                                    'snap-start shrink-0 min-w-[4.75rem] py-3.5 rounded-xl border-2 text-sm font-bold',
                                                    !slot.available && 'opacity-40 line-through border-slate-100',
                                                    slot.available &&
                                                        selectedSlot?.time === slot.time &&
                                                        'bg-indigo-950 text-amber-50 border-indigo-950',
                                                    slot.available &&
                                                        selectedSlot?.time !== slot.time &&
                                                        'border-amber-100 hover:border-amber-400'
                                                )}
                                            >
                                                {formatSlotHour(slot.time)}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center rounded-xl border-2 border-dashed border-amber-200 text-sm font-bold text-slate-500">
                                        No slots — change date
                                    </div>
                                )}

                                {selectedSlot && (
                                    <p className="text-sm font-black text-indigo-950 text-center">{selectionSummary}</p>
                                )}
                            </motion.div>
                        )}

                        {step === 2 && !isProfessionalPlayer && (
                            <motion.div
                                key="s2"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4"
                            >
                                <button
                                    type="button"
                                    disabled={bookingLoading}
                                    onClick={() => handleBooking(null)}
                                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-amber-100 hover:border-indigo-950 hover:bg-indigo-950/5 transition-all active:scale-[0.98] disabled:opacity-60"
                                >
                                    <BuildingOffice2Icon className="h-10 w-10 text-indigo-950" />
                                    <span className="font-black text-slate-900">Court only</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBookingMode('pro');
                                        setStep(3);
                                    }}
                                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-amber-100 hover:border-indigo-950 hover:bg-indigo-950/5 transition-all active:scale-[0.98]"
                                >
                                    <UserIcon className="h-10 w-10 text-indigo-950" />
                                    <span className="font-black text-slate-900">Book with pro</span>
                                </button>
                            </motion.div>
                        )}

                        {step === 3 && bookingMode === 'pro' && (
                            <motion.div
                                key="s3pro"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                className="flex-1"
                            >
                                <ProSelectionList
                                    date={selectedDate}
                                    startTime={selectedSlot?.time}
                                    city={court.location?.city}
                                    onSelect={(proData) => handleBooking(proData)}
                                    onCancel={goBack}
                                    preSelectedPro={location.state?.preSelectedPro}
                                />
                            </motion.div>
                        )}

                        {step === 3 && bookingMode === 'court' && (
                            <motion.div
                                key="s3pay"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
                            >
                                <div className="w-full rounded-2xl bg-amber-50 border border-amber-100 p-5 space-y-2 text-left">
                                    <div className="flex justify-between font-bold text-sm">
                                        <span className="text-slate-500">When</span>
                                        <span className="text-slate-900">{selectionSummary}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-sm">
                                        <span className="text-slate-500">Total</span>
                                        <span className="text-indigo-950 text-lg">
                                            Rs.{court.pricePerHour?.toLocaleString?.() ?? court.pricePerHour}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    onClick={handlePayNow}
                                    disabled={!selectedBooking?._id || paymentLoading}
                                    isLoading={paymentLoading}
                                    fullWidth
                                    className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base max-w-sm"
                                >
                                    {getPayButtonLabel(paymentMockMode)}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Step footer — only steps 1 & 2 (step 3 has its own actions) */}
                    {step < 3 && (
                        <div className="flex gap-3 mt-8 pt-6 border-t border-amber-50">
                            {step > 1 && !isProfessionalPlayer && (
                                <Button variant="outline" onClick={goBack} className="flex-1 h-12 rounded-xl font-bold">
                                    Back
                                </Button>
                            )}
                            {step === 1 && (
                                <Button
                                    onClick={continueFromDateTime}
                                    disabled={!selectedSlot || bookingLoading}
                                    isLoading={bookingLoading && isProfessionalPlayer}
                                    className="flex-1 h-12 rounded-xl font-bold bg-indigo-950 text-amber-50"
                                >
                                    {isProfessionalPlayer ? 'Book court' : 'Continue'}
                                    {!bookingLoading && (
                                        <ChevronRightIcon className="h-5 w-5 ml-1 inline" />
                                    )}
                                </Button>
                            )}
                        </div>
                    )}

                    {step === 3 && bookingMode === 'court' && (
                        <div className="mt-6 pt-4 border-t border-amber-50">
                            <Button variant="outline" onClick={goBack} fullWidth className="h-11 rounded-xl font-bold">
                                Back
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Venue info — after wizard, collapsed by default */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowVenueInfo((v) => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 font-bold text-slate-800 hover:bg-slate-50"
                >
                    Venue details
                    <ChevronRightIcon
                        className={twMerge('h-5 w-5 transition-transform', showVenueInfo && 'rotate-90')}
                    />
                </button>
                {showVenueInfo && (
                    <div className="px-5 pb-6 space-y-5 border-t border-slate-100">
                        <p className="text-slate-600 text-sm leading-relaxed pt-4">
                            {court.description || '—'}
                        </p>
                        {amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {amenities.map((a, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg"
                                    >
                                        <CheckCircleIcon className="h-3.5 w-3.5" />
                                        {a}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 text-sm font-bold">
                            <div className="rounded-xl bg-slate-50 p-3">
                                <span className="text-slate-400 text-[10px] uppercase block mb-1">Surface</span>
                                {formatSurface(court.surfaceType)}
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                <span className="text-slate-400 text-[10px] uppercase block mb-1">Hours</span>
                                {hoursLabel}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 flex items-start gap-1">
                            <MapPinIcon className="h-4 w-4 shrink-0" />
                            {court.location?.address}, {court.location?.city}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourtDetails;
