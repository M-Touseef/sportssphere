import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import coachService from '../../services/coachService';
import { getAllCourts } from '../../services/courtService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import HourSlotSelect from '../../components/ui/HourSlotSelect';
import { formatSlotHourRange } from '../../utils/timeFormat';
import { twMerge } from 'tailwind-merge';
import {
    BuildingOffice2Icon,
    CalendarDaysIcon,
    MapPinIcon,
    PlusIcon,
    TrashIcon,
    ClockIcon,
    PencilSquareIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolid } from '@heroicons/react/24/solid';

const DAYS = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' }
];

const DAY_ORDER = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };

const COURT_STEPS = [
    { id: 1, label: 'Court' },
    { id: 2, label: 'Date' },
    { id: 3, label: 'Time' },
    { id: 4, label: 'Confirm' }
];

const StepBar = ({ steps, current }) => (
    <div className="flex items-center w-full mb-6">
        {steps.map((s, i) => {
            const done = current > s.id;
            const active = current === s.id;
            return (
                <div key={s.id} className={twMerge('flex items-center', i < steps.length - 1 && 'flex-1')}>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                            className={twMerge(
                                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-black border-2',
                                done && 'bg-emerald-600 border-emerald-600 text-white',
                                active && !done && 'bg-indigo-950 border-indigo-950 text-amber-100',
                                !done && !active && 'bg-white border-slate-200 text-slate-400'
                            )}
                        >
                            {done ? <CheckSolid className="h-4 w-4" /> : s.id}
                        </div>
                        <span
                            className={twMerge(
                                'text-[9px] font-bold uppercase hidden sm:block',
                                active ? 'text-indigo-950' : 'text-slate-400'
                            )}
                        >
                            {s.label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div
                            className={twMerge(
                                'h-0.5 flex-1 mx-2 rounded-full',
                                current > s.id ? 'bg-emerald-500' : 'bg-slate-200'
                            )}
                        />
                    )}
                </div>
            );
        })}
    </div>
);

const formatReservationLabel = (b) => {
    const d = new Date(b.date);
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return `${b.court?.name || 'Court'} · ${day} · ${formatSlotHourRange(b.startTime, b.endTime)}`;
};

const CoachSchedule = () => {
    const [searchParams] = useSearchParams();
    const [reservations, setReservations] = useState([]);
    const [courts, setCourts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCourtWizard, setShowCourtWizard] = useState(false);
    const [courtStep, setCourtStep] = useState(1);
    const [courtForm, setCourtForm] = useState({ courtId: '', date: '', startTime: '', endTime: '' });
    const [courtSubmitting, setCourtSubmitting] = useState(false);

    const [showSlotForm, setShowSlotForm] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState(null);
    const [slotForm, setSlotForm] = useState({
        day: 'monday',
        startTime: '09:00',
        endTime: '10:00',
        maxStudents: 1,
        courtBookingId: ''
    });

    const { success, error: toastError } = useToast();
    const toastErrorRef = useRef(toastError);
    toastErrorRef.current = toastError;
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const refreshAll = async () => {
        const [bookingsResult, courtsResult, profileResult] = await Promise.allSettled([
            coachService.getCourtBookings(),
            getAllCourts(),
            coachService.getMyProfile()
        ]);

        if (bookingsResult.status === 'fulfilled') {
            setReservations(bookingsResult.value?.data ?? []);
        }
        if (courtsResult.status === 'fulfilled') {
            const courtsPayload = courtsResult.value;
            setCourts(courtsPayload?.data ?? courtsPayload ?? []);
        }
        if (profileResult.status === 'fulfilled') {
            const profile = profileResult.value?.data ?? profileResult.value;
            setSlots(profile?.availability ?? []);
        } else {
            setSlots([]);
        }

        if (bookingsResult.status === 'rejected' && courtsResult.status === 'rejected') {
            toastErrorRef.current('Failed to load schedule.');
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshAll();
    }, []);

    useEffect(() => {
        if (loading) return;
        const tab = searchParams.get('tab');
        if (tab === 'courts') setShowCourtWizard(true);
        if (tab === 'weekly' && reservations.length > 0) setShowSlotForm(true);
    }, [loading, searchParams, reservations.length]);

    const upcomingReservations = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return reservations
            .filter((b) => new Date(b.date) >= now && b.status !== 'cancelled')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [reservations]);

    const sortedSlots = useMemo(
        () =>
            [...slots].sort((a, b) => {
                const d = DAY_ORDER[a.day] - DAY_ORDER[b.day];
                return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
            }),
        [slots]
    );

    const selectedCourt = courts.find((c) => c._id === courtForm.courtId);

    const courtSummary = useMemo(() => {
        if (!courtForm.courtId || !courtForm.date || !courtForm.startTime) return null;
        const dateLabel = new Date(courtForm.date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        return {
            court: selectedCourt?.name || 'Court',
            city: selectedCourt?.location?.city,
            when: `${dateLabel} · ${formatSlotHourRange(courtForm.startTime, courtForm.endTime)}`
        };
    }, [courtForm, selectedCourt]);

    const resetCourtWizard = () => {
        setCourtStep(1);
        setCourtForm({ courtId: '', date: '', startTime: '', endTime: '' });
        setShowCourtWizard(false);
    };

    const resetSlotForm = () => {
        setSlotForm({
            day: 'monday',
            startTime: '09:00',
            endTime: '10:00',
            maxStudents: 1,
            courtBookingId: upcomingReservations[0]?._id || ''
        });
        setEditingSlotId(null);
        setShowSlotForm(false);
    };

    const handleCourtSubmit = async () => {
        if (courtForm.endTime && courtForm.endTime <= courtForm.startTime) {
            toastError('End time must be after start time.');
            return;
        }
        setCourtSubmitting(true);
        try {
            const res = await coachService.createCourtBooking(courtForm);
            const newBookingId = res?.data?._id;
            success('Court reserved! Now add when you coach each week.');
            resetCourtWizard();
            await refreshAll();
            setShowSlotForm(true);
            setSlotForm((f) => ({
                ...f,
                courtBookingId: newBookingId || f.courtBookingId
            }));
        } catch (err) {
            toastError(err.response?.data?.error || 'Could not reserve court');
        } finally {
            setCourtSubmitting(false);
        }
    };

    const handleCourtCancel = async (id) => {
        if (!window.confirm('Cancel this court reservation?')) return;
        try {
            await coachService.cancelCourtBooking(id);
            success('Reservation cancelled.');
            refreshAll();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to cancel');
        }
    };

    const handleSlotSave = async (e) => {
        e.preventDefault();
        if (!slotForm.courtBookingId) {
            toastError('Link this slot to a court reservation first.');
            return;
        }
        if (slotForm.endTime <= slotForm.startTime) {
            toastError('End time must be after start time.');
            return;
        }
        try {
            const payload = {
                day: slotForm.day,
                startTime: slotForm.startTime,
                endTime: slotForm.endTime,
                courtBookingId: slotForm.courtBookingId,
                maxStudents: parseInt(slotForm.maxStudents, 10) || 1
            };
            const response = editingSlotId
                ? await coachService.updateAvailabilitySlot(editingSlotId, payload)
                : await coachService.addAvailabilitySlot(payload);
            if (response.success) {
                setSlots(response.data);
                success(editingSlotId ? 'Weekly slot updated.' : 'Weekly slot added.');
                resetSlotForm();
            }
        } catch (error) {
            toastError(error.response?.data?.error || 'Failed to save slot');
        }
    };

    const handleSlotDelete = async (id) => {
        if (!window.confirm('Remove this weekly slot?')) return;
        try {
            const response = await coachService.removeAvailabilitySlot(id);
            if (response.success) {
                setSlots(response.data);
                if (editingSlotId === id) resetSlotForm();
                success('Slot removed.');
            }
        } catch {
            toastError('Failed to remove slot');
        }
    };

    const openEditSlot = (slot) => {
        const bookingId = slot.courtBooking?._id?.toString?.() || slot.courtBooking?.toString?.() || '';
        setEditingSlotId(slot._id);
        setShowSlotForm(true);
        setSlotForm({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            courtBookingId: bookingId,
            maxStudents: slot.maxStudents || 1
        });
    };

    if (loading) return <LoadingSpinner />;

    const canAddWeekly = upcomingReservations.length > 0;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
            <div>
                <h1 className="text-2xl font-black text-slate-900">Schedule & courts</h1>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                    Reserve a court for a specific day, then set the weekly hours players can book.
                </p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
                    <span className="text-[10px] font-black uppercase text-emerald-800">Step 1</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">Reserve a court</p>
                    <p className="text-xs text-slate-600 mt-0.5">Pick venue, date & time</p>
                </div>
                <div
                    className={twMerge(
                        'rounded-2xl border-2 p-4',
                        canAddWeekly
                            ? 'border-indigo-200 bg-indigo-50/40'
                            : 'border-slate-200 bg-slate-50 opacity-80'
                    )}
                >
                    <span className="text-[10px] font-black uppercase text-indigo-800">Step 2</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">Weekly coaching</p>
                    <p className="text-xs text-slate-600 mt-0.5">Repeats every week</p>
                </div>
            </div>

            {/* —— Court reservations —— */}
            <section className="rounded-[1.75rem] border-2 border-amber-200/80 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-50 bg-amber-50/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <BuildingOffice2Icon className="h-5 w-5 text-indigo-950" />
                        <h2 className="font-black text-indigo-950">Court reservations</h2>
                    </div>
                    {!showCourtWizard && (
                        <Button
                            type="button"
                            onClick={() => {
                                setShowCourtWizard(true);
                                setCourtStep(1);
                            }}
                            className="h-10 text-sm font-bold bg-indigo-950 text-amber-50 gap-1 shrink-0"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Reserve
                        </Button>
                    )}
                </div>

                <div className="p-5 sm:p-6">
                    <AnimatePresence mode="wait">
                        {showCourtWizard ? (
                            <motion.div
                                key="wizard"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <StepBar steps={COURT_STEPS} current={courtStep} />

                                {courtStep === 1 && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-bold text-slate-700">Which court?</p>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {courts.map((c) => (
                                                <button
                                                    key={c._id}
                                                    type="button"
                                                    onClick={() =>
                                                        setCourtForm((f) => ({ ...f, courtId: c._id }))
                                                    }
                                                    className={twMerge(
                                                        'w-full text-left p-4 rounded-2xl border-2 transition-all',
                                                        courtForm.courtId === c._id
                                                            ? 'border-indigo-950 bg-indigo-950/5'
                                                            : 'border-amber-100 hover:border-amber-300'
                                                    )}
                                                >
                                                    <p className="font-black text-slate-900">{c.name}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                        <MapPinIcon className="h-3.5 w-3.5" />
                                                        {c.location?.city || '—'}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {courtStep === 2 && (
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 block mb-2">
                                            Which date?
                                        </label>
                                        <input
                                            type="date"
                                            min={todayStr}
                                            value={courtForm.date}
                                            onChange={(e) =>
                                                setCourtForm((f) => ({ ...f, date: e.target.value }))
                                            }
                                            className="w-full h-14 px-4 rounded-2xl border-2 border-amber-100 font-bold focus:border-amber-400 outline-none"
                                        />
                                    </div>
                                )}

                                {courtStep === 3 && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <HourSlotSelect
                                            label="Start"
                                            value={courtForm.startTime}
                                            onChange={(v) => setCourtForm((f) => ({ ...f, startTime: v }))}
                                        />
                                        <HourSlotSelect
                                            label="End"
                                            value={courtForm.endTime}
                                            onChange={(v) => setCourtForm((f) => ({ ...f, endTime: v }))}
                                        />
                                    </div>
                                )}

                                {courtStep === 4 && courtSummary && (
                                    <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 space-y-2 text-sm font-bold">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Court</span>
                                            <span className="text-slate-900">{courtSummary.court}</span>
                                        </div>
                                        {courtSummary.city && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">City</span>
                                                <span>{courtSummary.city}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">When</span>
                                            <span className="text-right">{courtSummary.when}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-8 pt-4 border-t border-amber-50">
                                    {courtStep > 1 ? (
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() => setCourtStep((s) => s - 1)}
                                            className="flex-1 h-12 rounded-xl font-bold"
                                        >
                                            Back
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={resetCourtWizard}
                                            className="flex-1 h-12 rounded-xl font-bold"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                    {courtStep < 4 ? (
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (courtStep === 1 && !courtForm.courtId) {
                                                    toastError('Select a court');
                                                    return;
                                                }
                                                if (courtStep === 2 && !courtForm.date) {
                                                    toastError('Pick a date');
                                                    return;
                                                }
                                                if (
                                                    courtStep === 3 &&
                                                    (!courtForm.startTime || !courtForm.endTime)
                                                ) {
                                                    toastError('Pick start and end time');
                                                    return;
                                                }
                                                if (
                                                    courtStep === 3 &&
                                                    courtForm.endTime <= courtForm.startTime
                                                ) {
                                                    toastError('End must be after start');
                                                    return;
                                                }
                                                setCourtStep((s) => s + 1);
                                            }}
                                            className="flex-1 h-12 rounded-xl font-bold bg-indigo-950 text-amber-50"
                                        >
                                            Continue
                                            <ChevronRightIcon className="h-5 w-5 ml-1 inline" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={handleCourtSubmit}
                                            isLoading={courtSubmitting}
                                            className="flex-1 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            Confirm reservation
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        ) : upcomingReservations.length === 0 ? (
                            <div className="py-10 text-center rounded-2xl border-2 border-dashed border-amber-200">
                                <BuildingOffice2Icon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                <p className="font-bold text-slate-800">No court bookings yet</p>
                                <p className="text-sm text-slate-500 mt-1">Tap Reserve to book your first court.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {upcomingReservations.map((b) => (
                                    <li
                                        key={b._id}
                                        className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-amber-100 bg-white"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-900 text-sm truncate">
                                                {b.court?.name}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                                                <span>
                                                    {new Date(b.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <span>·</span>
                                                <span className="flex items-center gap-1">
                                                    <ClockIcon className="h-3.5 w-3.5" />
                                                    {formatSlotHourRange(b.startTime, b.endTime)}
                                                </span>
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCourtCancel(b._id)}
                                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 shrink-0"
                                            title="Cancel"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* —— Weekly coaching —— */}
            <section
                className={twMerge(
                    'rounded-[1.75rem] border-2 bg-white shadow-sm overflow-hidden',
                    canAddWeekly ? 'border-amber-200/80' : 'border-slate-200 opacity-95'
                )}
            >
                <div className="px-5 py-4 border-b border-amber-50 bg-amber-50/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-5 w-5 text-indigo-950" />
                        <h2 className="font-black text-indigo-950">Weekly coaching hours</h2>
                    </div>
                    {canAddWeekly && !showSlotForm && (
                        <Button
                            type="button"
                            onClick={() => {
                                setEditingSlotId(null);
                                setSlotForm({
                                    day: 'monday',
                                    startTime: '09:00',
                                    endTime: '10:00',
                                    maxStudents: 1,
                                    courtBookingId: upcomingReservations[0]?._id || ''
                                });
                                setShowSlotForm(true);
                            }}
                            className="h-10 text-sm font-bold bg-indigo-950 text-amber-50 gap-1 shrink-0"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add hours
                        </Button>
                    )}
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                    {!canAddWeekly && (
                        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-medium">
                            Reserve a court above first — weekly hours must link to a court booking.
                        </p>
                    )}

                    <AnimatePresence>
                        {showSlotForm && canAddWeekly && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleSlotSave}
                                className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 p-5 space-y-4"
                            >
                                <p className="font-black text-slate-900">
                                    {editingSlotId ? 'Edit weekly hours' : 'New weekly hours'}
                                </p>

                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                        Linked court booking
                                    </label>
                                    <select
                                        value={slotForm.courtBookingId}
                                        onChange={(e) =>
                                            setSlotForm((f) => ({ ...f, courtBookingId: e.target.value }))
                                        }
                                        className="w-full h-12 rounded-xl border-2 border-amber-100 px-3 text-sm font-bold"
                                        required
                                    >
                                        <option value="">Choose reservation…</option>
                                        {upcomingReservations.map((b) => (
                                            <option key={b._id} value={b._id}>
                                                {formatReservationLabel(b)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                        Repeats on
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS.map((d) => (
                                            <button
                                                key={d.value}
                                                type="button"
                                                onClick={() => setSlotForm((f) => ({ ...f, day: d.value }))}
                                                className={twMerge(
                                                    'px-3 py-2 rounded-xl text-xs font-black border-2',
                                                    slotForm.day === d.value
                                                        ? 'bg-indigo-950 border-indigo-950 text-amber-50'
                                                        : 'border-amber-100 text-slate-600 hover:border-amber-300'
                                                )}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <HourSlotSelect
                                        label="From"
                                        value={slotForm.startTime}
                                        onChange={(v) => setSlotForm((f) => ({ ...f, startTime: v }))}
                                    />
                                    <HourSlotSelect
                                        label="To"
                                        value={slotForm.endTime}
                                        onChange={(v) => setSlotForm((f) => ({ ...f, endTime: v }))}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                                        Max students per session
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={slotForm.maxStudents}
                                        onChange={(e) =>
                                            setSlotForm((f) => ({ ...f, maxStudents: e.target.value }))
                                        }
                                        className="w-24 h-11 rounded-xl border-2 border-amber-100 px-3 font-bold"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetSlotForm}
                                        className="flex-1 h-11 rounded-xl font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {editingSlotId ? 'Save' : 'Add to schedule'}
                                    </Button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {sortedSlots.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500 font-medium">
                            {canAddWeekly
                                ? 'No weekly hours yet. Add hours so players can request sessions.'
                                : 'Weekly hours appear here after you reserve a court.'}
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {sortedSlots.map((slot) => (
                                <li
                                    key={slot._id}
                                    className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-amber-100"
                                >
                                    <div>
                                        <p className="font-black text-slate-900 capitalize text-sm">{slot.day}</p>
                                        <p className="text-sm text-indigo-950 font-bold mt-0.5">
                                            {formatSlotHourRange(slot.startTime, slot.endTime)}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {slot.court?.name || 'Court'} · max {slot.maxStudents || 1} student
                                            {(slot.maxStudents || 1) > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => openEditSlot(slot)}
                                            className="p-2 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSlotDelete(slot._id)}
                                            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
};

export default CoachSchedule;
