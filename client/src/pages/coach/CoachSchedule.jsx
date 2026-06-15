import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import coachService from '../../services/coachService';
import { getAllCourts } from '../../services/courtService';
import LoadingSpinner from '../../components/LoadingSpinner';
import CoachPageHeader from '../../components/coach/CoachPageHeader';
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
                                done && 'border-lime-500 bg-lime-500 text-slate-950',
                                active && !done && 'border-slate-950 bg-slate-950 text-white',
                                !done && !active && 'bg-white border-slate-200 text-slate-400'
                            )}
                        >
                            {done ? <CheckSolid className="h-4 w-4" /> : s.id}
                        </div>
                        <span
                            className={twMerge(
                                'text-[9px] font-bold uppercase hidden sm:block',
                                active ? 'text-slate-950' : 'text-slate-400'
                            )}
                        >
                            {s.label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div
                            className={twMerge(
                                'h-0.5 flex-1 mx-2 rounded-full',
                                current > s.id ? 'bg-lime-500' : 'bg-slate-200'
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
    const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

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
            const payload = profileResult.value;
            const profile = payload?.data ?? payload;
            setSlots(profile?.availability ?? []);
            setNeedsProfileSetup(Boolean(payload?.needsProfileSetup && !profile));
        } else {
            setSlots([]);
            setNeedsProfileSetup(false);
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
            city: selectedCourt?.location?.area || selectedCourt?.location?.city,
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
                setNeedsProfileSetup(false);
                if (response.profileAutoCreated) {
                    success(
                        'Coaching hours published. Complete your coach profile so players see your rates and bio.'
                    );
                } else {
                    success(
                        editingSlotId
                            ? 'Coaching hours updated.'
                            : 'Players can now request sessions on this date.'
                    );
                }
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
        <div className="mx-auto max-w-[1280px] space-y-6 pb-10">
            <CoachPageHeader
                eyebrow="Coaching calendar"
                title="Schedule & courts"
                description="Reserve a court for a specific date, then publish the coaching hours athletes can request inside that reservation."
                icon={CalendarDaysIcon}
                actions={(
                    <button
                        type="button"
                        onClick={() => {
                            if (showCourtWizard) {
                                resetCourtWizard();
                            } else {
                                setShowCourtWizard(true);
                                setCourtStep(1);
                            }
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition ${
                            showCourtWizard
                                ? 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                                : 'bg-lime-300 text-slate-950 hover:bg-lime-200'
                        }`}
                    >
                        <PlusIcon className={`h-5 w-5 transition ${showCourtWizard ? 'rotate-45' : ''}`} />
                        {showCourtWizard ? 'Close reservation form' : 'Reserve a court'}
                    </button>
                )}
            >
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-sky-100">{upcomingReservations.length} upcoming reservations</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">{slots.length} published coaching slots</span>
                </div>
            </CoachPageHeader>

            <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between gap-4">
                        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Reserved dates</p><p className="mt-2 text-3xl font-black text-slate-950">{upcomingReservations.length}</p></div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><BuildingOffice2Icon className="h-5 w-5" /></div>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between gap-4">
                        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-700">Open time blocks</p><p className="mt-2 text-3xl font-black text-slate-950">{slots.length}</p></div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-50 text-lime-700"><ClockIcon className="h-5 w-5" /></div>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between gap-4">
                        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">Athlete capacity</p><p className="mt-2 text-3xl font-black text-slate-950">{slots.reduce((total, slot) => total + (Number(slot.maxStudents) || 1), 0)}</p></div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><UserGroupIcon className="h-5 w-5" /></div>
                    </div>
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-6">
                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        ['01', 'Reserve the court', 'Choose the venue, date, and full time window you need.'],
                        ['02', 'Open coaching hours', 'Publish one or more athlete-facing slots inside the reservation.'],
                        ['03', 'Review requests', 'Athletes request those exact slots from your request inbox.']
                    ].map(([number, title, description]) => (
                        <div key={number} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">Step {number}</span>
                            <h2 className="mt-2 font-black text-slate-950">{title}</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="hidden">
                <h1 className="text-2xl font-black text-slate-900">Schedule & courts</h1>
                <p className="text-sm text-slate-600 mt-2 font-medium leading-relaxed">
                    In real life you book a <strong className="text-slate-800">court for a specific day</strong>, then
                    choose which hours on <em>that same day</em> you accept coaching requests. There is no automatic
                    repeat every week — book each date you want to coach.
                </p>
            </div>

            <div className="hidden rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-indigo-950 font-medium">
                <span className="font-black">1.</span> Reserve court (date + time) →{' '}
                <span className="font-black">2.</span> Open coaching hours on that reservation → players book that date
                only
            </div>

            {needsProfileSetup && (
                <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-amber-950">
                        Complete your public coach profile (rates, bio) so players can find you in the coach directory.
                    </p>
                    <Link
                        to="/coach/profile"
                        className="shrink-0 text-sm font-bold text-sky-800 hover:text-sky-950"
                    >
                        Set up profile →
                    </Link>
                </div>
            )}

            <div className="hidden justify-end">
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
                    <Motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                    >
                        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-8">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Reservation wizard</p>
                            <h2 className="mt-1 font-black text-slate-950">New court reservation</h2>
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
                                                'w-full rounded-2xl border p-4 text-left transition',
                                                courtForm.courtId === c._id
                                                    ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-100'
                                                    : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                                            )}
                                        >
                                            <p className="font-black">{c.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">{c.location?.area || 'Lahore'}</p>
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
                                    className="h-14 w-full rounded-2xl border border-slate-200 px-4 font-bold outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                                <div className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50 p-5 text-sm font-bold">
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
                            <div className="mt-8 flex gap-3 border-t border-slate-100 pt-5">
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
                                        className="h-12 flex-1 rounded-xl bg-slate-950 font-bold text-white hover:bg-sky-900"
                                    >
                                        Continue
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleCourtSubmit}
                                        isLoading={courtSubmitting}
                                        className="h-12 flex-1 rounded-xl bg-lime-300 font-bold text-slate-950 hover:bg-lime-200"
                                    >
                                        Confirm reservation
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Motion.section>
                )}
            </AnimatePresence>

            {upcomingReservations.length === 0 && !showCourtWizard ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/70 py-16 text-center">
                    <BuildingOffice2Icon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-800">No upcoming court bookings</p>
                    <p className="text-sm text-slate-500 mt-1">Reserve a court to start accepting players on that date.</p>
                </div>
            ) : (
                <ul className="grid gap-5 xl:grid-cols-2">
                    {upcomingReservations.map((booking) => {
                        const bid = booking._id;
                        const coachingHours = slotsByBooking.get(bid) || [];
                        const isOpen = coachingBookingId === bid;

                        return (
                            <li
                                key={bid}
                                className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
                            >
                                <div className="border-b border-slate-100 p-5 sm:p-6">
                                    <div className="flex justify-between gap-3">
                                        <div>
                                            <p className="font-black text-lg text-slate-900">
                                                {booking.court?.name || 'Court'}
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-sky-800">
                                                {formatBookingDate(booking.date)}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                                <ClockIcon className="h-4 w-4" />
                                                Court reserved{' '}
                                                {formatSlotHourRange(booking.startTime, booking.endTime)}
                                            </p>
                                            {(booking.court?.location?.area || booking.court?.location?.city) && (
                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    <MapPinIcon className="h-3.5 w-3.5" />
                                                    {booking.court.location.area || booking.court.location.city}
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

                                <div className="bg-slate-50/70 p-5 sm:p-6">
                                    <p className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-2">
                                        <UserGroupIcon className="h-4 w-4" />
                                        Coaching on this date only
                                    </p>

                                    {coachingHours.length > 0 ? (
                                        <ul className="space-y-2 mb-3">
                                            {coachingHours.map((slot) => (
                                                <li
                                                    key={slot._id}
                                                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"
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
                                            className="space-y-3 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm"
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
                                                    className="mt-1 h-10 w-20 rounded-lg border border-slate-200 px-2 font-bold outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                                                    className="h-10 flex-1 rounded-xl bg-slate-950 font-bold text-white hover:bg-sky-900"
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
                                            className="h-11 w-full border-sky-200 font-bold text-sky-800 hover:bg-sky-50"
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
