import { useState, useEffect, useMemo, useRef } from 'react';
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
    MapPinIcon,
    PlusIcon,
    TrashIcon,
    ClockIcon,
    PencilSquareIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolid } from '@heroicons/react/24/solid';

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

const bookingIdOf = (ref) => (ref?._id || ref)?.toString?.() || '';

const formatBookingDate = (dateValue) =>
    new Date(dateValue).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

const CoachSchedule = () => {
    const [reservations, setReservations] = useState([]);
    const [courts, setCourts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCourtWizard, setShowCourtWizard] = useState(false);
    const [courtStep, setCourtStep] = useState(1);
    const [courtForm, setCourtForm] = useState({ courtId: '', date: '', startTime: '', endTime: '' });
    const [courtSubmitting, setCourtSubmitting] = useState(false);

    const [coachingBookingId, setCoachingBookingId] = useState(null);
    const [editingSlotId, setEditingSlotId] = useState(null);
    const [coachingForm, setCoachingForm] = useState({
        startTime: '09:00',
        endTime: '10:00',
        maxStudents: 1
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

    const upcomingReservations = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return reservations
            .filter((b) => new Date(b.date) >= now && b.status !== 'cancelled')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [reservations]);

    const slotsByBooking = useMemo(() => {
        const map = new Map();
        for (const slot of slots) {
            const bid = bookingIdOf(slot.courtBooking);
            if (!bid) continue;
            if (!map.has(bid)) map.set(bid, []);
            map.get(bid).push(slot);
        }
        for (const [, list] of map) {
            list.sort((a, b) => a.startTime.localeCompare(b.startTime));
        }
        return map;
    }, [slots]);

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

    const openCoachingForm = (booking, slot = null) => {
        setCoachingBookingId(booking._id);
        if (slot) {
            setEditingSlotId(slot._id);
            setCoachingForm({
                startTime: slot.startTime,
                endTime: slot.endTime,
                maxStudents: slot.maxStudents || 1
            });
        } else {
            setEditingSlotId(null);
            setCoachingForm({
                startTime: booking.startTime,
                endTime:
                    booking.endTime > booking.startTime
                        ? `${(parseInt(booking.startTime.split(':')[0], 10) + 1)
                              .toString()
                              .padStart(2, '0')}:00`
                        : booking.endTime,
                maxStudents: 1
            });
        }
    };

    const closeCoachingForm = () => {
        setCoachingBookingId(null);
        setEditingSlotId(null);
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
            success('Court reserved. Now open coaching hours for that date.');
            resetCourtWizard();
            await refreshAll();
            const created = res?.data;
            if (created?._id) {
                openCoachingForm(created);
            }
        } catch (err) {
            toastError(err.response?.data?.error || 'Could not reserve court');
        } finally {
            setCourtSubmitting(false);
        }
    };

    const handleCourtCancel = async (id) => {
        if (!window.confirm('Cancel this court reservation? Coaching hours on this date will be removed.')) return;
        try {
            await coachService.cancelCourtBooking(id);
            if (coachingBookingId === id) closeCoachingForm();
            success('Reservation cancelled.');
            refreshAll();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to cancel');
        }
    };

    const handleCoachingSave = async (e) => {
        e.preventDefault();
        if (!coachingBookingId) return;
        const booking = upcomingReservations.find((b) => b._id === coachingBookingId);
        if (!booking) return;

        if (coachingForm.endTime <= coachingForm.startTime) {
            toastError('Coaching end time must be after start.');
            return;
        }
        if (coachingForm.startTime < booking.startTime || coachingForm.endTime > booking.endTime) {
            toastError('Coaching hours must stay inside your court reservation.');
            return;
        }

        try {
            const payload = {
                courtBookingId: coachingBookingId,
                startTime: coachingForm.startTime,
                endTime: coachingForm.endTime,
                maxStudents: parseInt(coachingForm.maxStudents, 10) || 1
            };
            const response = editingSlotId
                ? await coachService.updateAvailabilitySlot(editingSlotId, payload)
                : await coachService.addAvailabilitySlot(payload);
            if (response.success) {
                setSlots(response.data);
                success(
                    editingSlotId
                        ? 'Coaching hours updated.'
                        : 'Players can now request sessions on this date.'
                );
                closeCoachingForm();
            }
        } catch (error) {
            toastError(error.response?.data?.error || 'Failed to save coaching hours');
        }
    };

    const handleSlotDelete = async (id) => {
        if (!window.confirm('Remove these coaching hours?')) return;
        try {
            const response = await coachService.removeAvailabilitySlot(id);
            if (response.success) {
                setSlots(response.data);
                if (editingSlotId === id) closeCoachingForm();
                success('Coaching hours removed.');
            }
        } catch {
            toastError('Failed to remove');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900">Schedule & courts</h1>
                <p className="text-sm text-slate-600 mt-2 font-medium leading-relaxed">
                    In real life you book a <strong className="text-slate-800">court for a specific day</strong>, then
                    choose which hours on <em>that same day</em> you accept coaching requests. There is no automatic
                    repeat every week — book each date you want to coach.
                </p>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-indigo-950 font-medium">
                <span className="font-black">1.</span> Reserve court (date + time) →{' '}
                <span className="font-black">2.</span> Open coaching hours on that reservation → players book that date
                only
            </div>

            <div className="flex justify-end">
                {!showCourtWizard && (
                    <Button
                        type="button"
                        onClick={() => {
                            setShowCourtWizard(true);
                            setCourtStep(1);
                        }}
                        className="h-11 gap-2 font-bold bg-indigo-950 text-amber-50"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Reserve a court
                    </Button>
                )}
            </div>

            <AnimatePresence>
                {showCourtWizard && (
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-[1.75rem] border-2 border-amber-200/80 bg-white shadow-lg overflow-hidden"
                    >
                        <div className="px-5 py-4 border-b border-amber-50 bg-amber-50/40">
                            <h2 className="font-black text-indigo-950">New court reservation</h2>
                        </div>
                        <div className="p-5 sm:p-8">
                            <StepBar steps={COURT_STEPS} current={courtStep} />
                            {/* court wizard steps - same as before */}
                            {courtStep === 1 && (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {courts.map((c) => (
                                        <button
                                            key={c._id}
                                            type="button"
                                            onClick={() => setCourtForm((f) => ({ ...f, courtId: c._id }))}
                                            className={twMerge(
                                                'w-full text-left p-4 rounded-2xl border-2',
                                                courtForm.courtId === c._id
                                                    ? 'border-indigo-950 bg-indigo-950/5'
                                                    : 'border-amber-100'
                                            )}
                                        >
                                            <p className="font-black">{c.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">{c.location?.city}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {courtStep === 2 && (
                                <input
                                    type="date"
                                    min={todayStr}
                                    value={courtForm.date}
                                    onChange={(e) => setCourtForm((f) => ({ ...f, date: e.target.value }))}
                                    className="w-full h-14 px-4 rounded-2xl border-2 border-amber-100 font-bold"
                                />
                            )}
                            {courtStep === 3 && (
                                <div className="grid grid-cols-2 gap-4">
                                    <HourSlotSelect
                                        label="Court from"
                                        value={courtForm.startTime}
                                        onChange={(v) => setCourtForm((f) => ({ ...f, startTime: v }))}
                                    />
                                    <HourSlotSelect
                                        label="Court until"
                                        value={courtForm.endTime}
                                        onChange={(v) => setCourtForm((f) => ({ ...f, endTime: v }))}
                                    />
                                </div>
                            )}
                            {courtStep === 4 && courtSummary && (
                                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 space-y-2 text-sm font-bold">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Court</span>
                                        <span>{courtSummary.court}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">When</span>
                                        <span>{courtSummary.when}</span>
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
                                            if (courtStep === 3 && (!courtForm.startTime || !courtForm.endTime)) {
                                                toastError('Pick court hours');
                                                return;
                                            }
                                            setCourtStep((s) => s + 1);
                                        }}
                                        className="flex-1 h-12 rounded-xl font-bold bg-indigo-950 text-amber-50"
                                    >
                                        Continue
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleCourtSubmit}
                                        isLoading={courtSubmitting}
                                        className="flex-1 h-12 rounded-xl font-bold bg-emerald-600 text-white"
                                    >
                                        Confirm reservation
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {upcomingReservations.length === 0 && !showCourtWizard ? (
                <div className="py-16 text-center rounded-2xl border-2 border-dashed border-amber-200">
                    <BuildingOffice2Icon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-800">No upcoming court bookings</p>
                    <p className="text-sm text-slate-500 mt-1">Reserve a court to start accepting players on that date.</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {upcomingReservations.map((booking) => {
                        const bid = booking._id;
                        const coachingHours = slotsByBooking.get(bid) || [];
                        const isOpen = coachingBookingId === bid;

                        return (
                            <li
                                key={bid}
                                className="rounded-[1.75rem] border-2 border-amber-100 bg-white shadow-sm overflow-hidden"
                            >
                                <div className="p-5 border-b border-amber-50">
                                    <div className="flex justify-between gap-3">
                                        <div>
                                            <p className="font-black text-lg text-slate-900">
                                                {booking.court?.name || 'Court'}
                                            </p>
                                            <p className="text-sm font-bold text-indigo-950 mt-1">
                                                {formatBookingDate(booking.date)}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                                <ClockIcon className="h-4 w-4" />
                                                Court reserved{' '}
                                                {formatSlotHourRange(booking.startTime, booking.endTime)}
                                            </p>
                                            {booking.court?.location?.city && (
                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    <MapPinIcon className="h-3.5 w-3.5" />
                                                    {booking.court.location.city}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCourtCancel(bid)}
                                            className="p-2 h-fit text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                            title="Cancel reservation"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50/50">
                                    <p className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-2">
                                        <UserGroupIcon className="h-4 w-4" />
                                        Coaching on this date only
                                    </p>

                                    {coachingHours.length > 0 ? (
                                        <ul className="space-y-2 mb-3">
                                            {coachingHours.map((slot) => (
                                                <li
                                                    key={slot._id}
                                                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white border border-amber-100"
                                                >
                                                    <span className="font-bold text-slate-900">
                                                        {formatSlotHourRange(slot.startTime, slot.endTime)}
                                                        <span className="text-slate-500 font-medium text-xs ml-2">
                                                            · max {slot.maxStudents || 1}
                                                        </span>
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openCoachingForm(booking, slot)}
                                                            className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-700"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSlotDelete(slot._id)}
                                                            className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-500 mb-3">
                                            Not open to players yet — add coaching hours within your court time.
                                        </p>
                                    )}

                                    {isOpen ? (
                                        <form
                                            onSubmit={handleCoachingSave}
                                            className="rounded-2xl border-2 border-indigo-200 bg-white p-4 space-y-3"
                                        >
                                            <p className="text-sm font-black text-slate-900">
                                                {editingSlotId ? 'Edit coaching hours' : 'Open for players'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Must be between {formatSlotHourRange(booking.startTime, booking.endTime)}
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <HourSlotSelect
                                                    label="Coaching from"
                                                    value={coachingForm.startTime}
                                                    onChange={(v) =>
                                                        setCoachingForm((f) => ({ ...f, startTime: v }))
                                                    }
                                                />
                                                <HourSlotSelect
                                                    label="Coaching until"
                                                    value={coachingForm.endTime}
                                                    onChange={(v) =>
                                                        setCoachingForm((f) => ({ ...f, endTime: v }))
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500">
                                                    Max students
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={20}
                                                    value={coachingForm.maxStudents}
                                                    onChange={(e) =>
                                                        setCoachingForm((f) => ({
                                                            ...f,
                                                            maxStudents: e.target.value
                                                        }))
                                                    }
                                                    className="mt-1 w-20 h-10 rounded-lg border-2 border-amber-100 px-2 font-bold"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={closeCoachingForm}
                                                    className="flex-1 h-10 rounded-xl font-bold"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    className="flex-1 h-10 rounded-xl font-bold bg-emerald-600 text-white"
                                                >
                                                    {editingSlotId ? 'Save' : 'Publish'}
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => openCoachingForm(booking)}
                                            className="w-full h-11 font-bold border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                                        >
                                            <PlusIcon className="h-4 w-4 mr-1" />
                                            {coachingHours.length ? 'Add more hours' : 'Open coaching hours'}
                                        </Button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default CoachSchedule;
