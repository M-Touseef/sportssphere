import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import {
    ArrowRightIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    CurrencyDollarIcon,
    MapPinIcon,
    ShieldCheckIcon,
    SparklesIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import courtService from '../../services/courtService';
import { getPaymentConfig, getPayButtonLabel, payForBooking } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatSlotHour } from '../../utils/timeFormat';
import Button from '../ui/Button';
import ProSelectionList from './ProSelectionList';

const TODAY = new Date().toISOString().split('T')[0];

const getEndTime = (startTime) => {
    const [hours, minutes = '00'] = startTime.split(':');
    return `${String(Number(hours) + 1).padStart(2, '0')}:${minutes}`;
};

const formatDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
});

const buildOperatingSlots = (court) => {
    if (!court?.openingTime || !court?.closingTime) return [];
    const openingHour = Number(court.openingTime.split(':')[0]);
    const closingHour = Number(court.closingTime.split(':')[0]);
    const result = [];

    for (let hour = openingHour; hour < closingHour; hour += 1) {
        result.push({ time: `${String(hour).padStart(2, '0')}:00`, available: true });
    }

    return result;
};

const ModeCard = ({ active, icon, title, description, badge, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={twMerge(
            'group relative min-h-40 overflow-hidden rounded-3xl border p-5 text-left transition-all duration-200 sm:p-6',
            active
                ? 'border-indigo-950 bg-indigo-950 text-white shadow-xl shadow-indigo-950/20'
                : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg'
        )}
    >
        <div className="flex items-start gap-4">
            <span className={twMerge(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                active ? 'bg-lime-300 text-indigo-950' : 'bg-sky-50 text-sky-800'
            )}>
                {createElement(icon, { className: 'h-6 w-6' })}
            </span>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className={twMerge('font-black', active ? 'text-white' : 'text-slate-950')}>{title}</h3>
                    {badge && (
                        <span className={twMerge(
                            'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
                            active ? 'bg-white/10 text-amber-200' : 'bg-emerald-50 text-emerald-700'
                        )}>
                            {badge}
                        </span>
                    )}
                </div>
                <p className={twMerge('mt-2 text-sm font-medium leading-relaxed', active ? 'text-indigo-100' : 'text-slate-500')}>
                    {description}
                </p>
            </div>
        </div>
        {active ? (
            <CheckCircleIcon className="absolute right-4 top-4 h-6 w-6 text-lime-300" />
        ) : (
            <ArrowRightIcon className="absolute bottom-5 right-5 h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-sky-700" />
        )}
    </button>
);

const SlotGrid = ({ slots, selectedTime, onSelect, loading = false }) => {
    if (loading) {
        return (
            <div className="flex min-h-36 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-700" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((slot) => {
                const endTime = getEndTime(slot.time);
                const selected = selectedTime === slot.time;
                return (
                    <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => onSelect(slot)}
                        className={twMerge(
                            'rounded-xl border px-2 py-3 text-center transition-all',
                            !slot.available && 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through',
                            slot.available && selected && 'border-indigo-950 bg-indigo-950 text-white shadow-lg',
                            slot.available && !selected && 'border-slate-200 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50'
                        )}
                    >
                        <span className="block text-xs font-black">{formatSlotHour(slot.time)}</span>
                        <span className={twMerge('mt-0.5 block text-[10px] font-bold', selected ? 'text-indigo-200' : 'text-slate-400')}>
                            to {formatSlotHour(endTime)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default function NormalPlayerBookingFlow({ court, courtId }) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { success, error: toastError } = useToast();
    const [mode, setMode] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [courtSlots, setCourtSlots] = useState([]);
    const [courtSlotsLoading, setCourtSlotsLoading] = useState(false);
    const [selectedCourtSlot, setSelectedCourtSlot] = useState(null);
    const [selectedProSlot, setSelectedProSlot] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentMockMode, setPaymentMockMode] = useState(true);
    const availabilityRequest = useRef(0);
    const operatingSlots = useMemo(() => buildOperatingSlots(court), [court]);

    useEffect(() => {
        getPaymentConfig()
            .then((config) => setPaymentMockMode(Boolean(config?.mockMode)))
            .catch(() => setPaymentMockMode(true));
    }, []);

    const loadCourtSlots = useCallback(async (date) => {
        if (!date) {
            setCourtSlots([]);
            return;
        }

        const requestId = ++availabilityRequest.current;
        setCourtSlotsLoading(true);
        try {
            const data = await courtService.getAvailability(courtId, date);
            if (requestId !== availabilityRequest.current) return;
            setCourtSlots(Array.isArray(data?.data) ? data.data : []);
        } catch (error) {
            if (requestId !== availabilityRequest.current) return;
            console.error('Error loading court slots:', error);
            setCourtSlots([]);
            toastError('Could not load court availability for this date.');
        } finally {
            if (requestId === availabilityRequest.current) setCourtSlotsLoading(false);
        }
    }, [courtId, toastError]);

    useEffect(() => {
        if (mode !== 'court' || !selectedDate) return;
        loadCourtSlots(selectedDate);
    }, [loadCourtSlots, mode, selectedDate]);

    const selectMode = (nextMode) => {
        availabilityRequest.current += 1;
        setMode(nextMode);
        setSelectedDate('');
        setCourtSlots([]);
        setSelectedCourtSlot(null);
        setSelectedProSlot(null);
    };

    const ensureAuthenticated = () => {
        if (isAuthenticated) return true;
        navigate('/login', { state: { from: `/courts/${courtId}` } });
        return false;
    };

    const completePayment = async (bookingPayload, successMessage) => {
        if (!ensureAuthenticated()) return;

        try {
            setPaymentLoading(true);
            const response = await courtService.createBooking(bookingPayload);
            const result = await payForBooking(response.data._id);

            if (result?.completed) {
                success(successMessage);
                selectMode(null);
            }
        } catch (error) {
            const message = error.response?.data?.error || error.message || 'Payment could not be completed.';
            toastError(message);
            if (message.includes('booked') || message.includes('reserved')) {
                if (mode === 'court') loadCourtSlots(selectedDate);
                setSelectedCourtSlot(null);
                setSelectedProSlot(null);
            }
        } finally {
            setPaymentLoading(false);
        }
    };

    const payForCourtOnly = () => {
        if (!selectedDate || !selectedCourtSlot) return;
        completePayment({
            courtId,
            date: selectedDate,
            startTime: selectedCourtSlot.time,
            endTime: getEndTime(selectedCourtSlot.time)
        }, 'Court booking confirmed!');
    };

    const sendProfessionalRequest = async (professional) => {
        if (!selectedProSlot || !professional?.date) return;
        if (!ensureAuthenticated()) return;

        try {
            setPaymentLoading(true);
            await courtService.createBooking({
                courtId,
                date: professional.date,
                startTime: selectedProSlot.time,
                endTime: getEndTime(selectedProSlot.time),
                proPlayerId: professional.player._id
            });
            success(`Request sent to ${professional.player.name}. They have 30 minutes to respond.`);
            navigate('/app/sparring/requests');
        } catch (requestError) {
            toastError(requestError.response?.data?.message || 'Unable to send booking request');
        } finally {
            setPaymentLoading(false);
        }
    };

    return (
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100/70 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.32)]">
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-sky-950 px-5 py-7 text-white sm:px-8 lg:px-10">
                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300">Complete your booking</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Choose how you want to play</h2>
                        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-300">
                            Reserve the venue for your own game, or pair the court with an available professional player.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">Location</p>
                            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-white">
                                <MapPinIcon className="h-4 w-4" />
                                {court.location?.area || 'Lahore'}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">Court rate</p>
                            <p className="mt-1 text-sm font-black text-white">Rs.{Number(court.pricePerHour || 0).toLocaleString()}/hr</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-5 sm:p-8 lg:p-10">
                <div className="grid gap-4 md:grid-cols-2">
                    <ModeCard
                        active={mode === 'court'}
                        icon={BuildingOffice2Icon}
                        title="Book Court Only"
                        description="Pick your date first, then choose from the court's available time slots."
                        onClick={() => selectMode('court')}
                    />
                    <ModeCard
                        active={mode === 'pro'}
                        icon={UserGroupIcon}
                        title="Court with Professional"
                        description="Pick a time and instantly see professionals with their next matching date."
                        badge="Live availability"
                        onClick={() => selectMode('pro')}
                    />
                </div>

                {!mode && (
                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <CalendarDaysIcon className="h-5 w-5 text-sky-700" />
                            <p className="mt-3 text-sm font-black text-slate-900">Real-time availability</p>
                            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">See available court and player times before confirming.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <ShieldCheckIcon className="h-5 w-5 text-emerald-700" />
                            <p className="mt-3 text-sm font-black text-slate-900">Clear checkout</p>
                            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">Review the court fee and selected schedule before payment.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <SparklesIcon className="h-5 w-5 text-indigo-700" />
                            <p className="mt-3 text-sm font-black text-slate-900">Flexible play</p>
                            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">Book only the court or add a professional to your session.</p>
                        </div>
                    </div>
                )}

                {mode === 'court' && (
                    <div className="mt-7 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950 text-amber-200">
                                    <CalendarDaysIcon className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Step 1</p>
                                    <h3 className="font-black text-slate-950">Select your date</h3>
                                </div>
                            </div>
                            <input
                                type="date"
                                min={TODAY}
                                value={selectedDate}
                                onChange={(event) => {
                                    setSelectedDate(event.target.value);
                                    setSelectedCourtSlot(null);
                                }}
                                className="mt-5 h-14 w-full rounded-2xl border-2 border-white bg-white px-4 font-bold text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                            />
                            <p className="mt-3 text-xs font-medium leading-relaxed text-slate-500">
                                Available court times appear only after a date is selected.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-indigo-950">
                                    <ClockIcon className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Step 2</p>
                                    <h3 className="font-black text-slate-950">Choose an available slot</h3>
                                </div>
                            </div>

                            {!selectedDate ? (
                                <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-sm font-bold text-slate-400">
                                    Select a date first to load available times.
                                </div>
                            ) : courtSlots.length > 0 ? (
                                <SlotGrid
                                    slots={courtSlots}
                                    selectedTime={selectedCourtSlot?.time}
                                    onSelect={setSelectedCourtSlot}
                                    loading={courtSlotsLoading}
                                />
                            ) : courtSlotsLoading ? (
                                <SlotGrid slots={[]} loading />
                            ) : (
                                <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-5 text-center text-sm font-bold text-amber-800">
                                    No court slots are available on this date.
                                </div>
                            )}

                            {selectedCourtSlot && (
                                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="flex items-center justify-between gap-3 text-sm font-bold">
                                        <span className="text-slate-600">{formatDate(selectedDate)} at {formatSlotHour(selectedCourtSlot.time)}</span>
                                        <span className="text-lg font-black text-indigo-950">Rs.{Number(court.pricePerHour || 0).toLocaleString()}</span>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={payForCourtOnly}
                                        disabled={paymentLoading}
                                        isLoading={paymentLoading}
                                        fullWidth
                                        className="mt-4 h-[3.25rem] rounded-xl bg-emerald-600 font-black text-white hover:bg-emerald-700"
                                    >
                                        {getPayButtonLabel(paymentMockMode)}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mode === 'pro' && (
                    <div className="mt-7 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 xl:sticky xl:top-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950 text-amber-200">
                                    <ClockIcon className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Select time</p>
                                    <h3 className="font-black text-slate-950">Court operating slots</h3>
                                </div>
                            </div>
                            <p className="mt-3 text-xs font-medium leading-relaxed text-slate-500">
                                Changing the slot refreshes professional availability immediately. The date is finalized from the professional's schedule.
                            </p>
                            <div className="mt-5">
                                <SlotGrid
                                    slots={operatingSlots}
                                    selectedTime={selectedProSlot?.time}
                                    onSelect={setSelectedProSlot}
                                />
                            </div>
                            <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-900">
                                        <CurrencyDollarIcon className="h-5 w-5" /> Court fee
                                    </span>
                                    <span className="text-base font-black text-indigo-950">Rs.{Number(court.pricePerHour || 0).toLocaleString()}</span>
                                </div>
                                <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
                                    The selected professional's fee is shown separately. They have 30 minutes to accept your request.
                                </p>
                            </div>
                        </div>

                        <div className="flex min-h-[28rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 [&>div]:flex-1">
                            <ProSelectionList
                                startTime={selectedProSlot?.time}
                                area={court.location?.area}
                                courtId={courtId}
                                onSelect={sendProfessionalRequest}
                                selecting={paymentLoading}
                                actionLabel="Send 30-minute request"
                                compact
                            />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
