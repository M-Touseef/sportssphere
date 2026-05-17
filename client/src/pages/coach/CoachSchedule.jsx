import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import coachService from '../../services/coachService';
import { getAllCourts } from '../../services/courtService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import FriendlyTimePicker from '../../components/professional/FriendlyTimePicker';
import HourSlotSelect from '../../components/ui/HourSlotSelect';
import { formatSlotHourRange } from '../../utils/timeFormat';
import { twMerge } from 'tailwind-merge';
import {
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CalendarIcon,
    MapPinIcon,
    PlusIcon,
    TrashIcon,
    ClockIcon,
    PencilSquareIcon,
    XMarkIcon,
    BanknotesIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

const TABS = [
    { id: 'courts', label: 'Court reservations', icon: BuildingOffice2Icon },
    { id: 'weekly', label: 'Weekly coaching', icon: CalendarIcon }
];

const DAYS = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
];

const DAY_ORDER = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };

const CoachSchedule = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'weekly' ? 'weekly' : 'courts';

    const [reservations, setReservations] = useState([]);
    const [courts, setCourts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCourtForm, setShowCourtForm] = useState(true);
    const [courtSubmitting, setCourtSubmitting] = useState(false);
    const [courtForm, setCourtForm] = useState({ courtId: '', date: '', startTime: '', endTime: '' });

    const [showSlotForm, setShowSlotForm] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState(null);

    const { success, error: toastError } = useToast();
    const toastErrorRef = useRef(toastError);
    toastErrorRef.current = toastError;
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const {
        register: registerSlot,
        handleSubmit: handleSlotSubmit,
        reset: resetSlot,
        control,
        formState: { errors: slotErrors }
    } = useForm({
        defaultValues: {
            day: 'monday',
            startTime: '09:00',
            endTime: '10:00',
            maxStudents: 1,
            courtBookingId: ''
        }
    });

    const setTab = (tabId) => {
        setSearchParams(tabId === 'courts' ? {} : { tab: tabId }, { replace: true });
    };

    const refreshAll = async () => {
        const [bookingsResult, courtsResult, profileResult] = await Promise.allSettled([
            coachService.getCourtBookings(),
            getAllCourts(),
            coachService.getMyProfile()
        ]);

        if (bookingsResult.status === 'fulfilled') {
            setReservations(bookingsResult.value?.data ?? []);
        } else {
            console.error('Court bookings:', bookingsResult.reason);
        }

        if (courtsResult.status === 'fulfilled') {
            const courtsPayload = courtsResult.value;
            setCourts(courtsPayload?.data ?? courtsPayload ?? []);
        } else {
            console.error('Courts list:', courtsResult.reason);
        }

        if (profileResult.status === 'fulfilled') {
            const profile = profileResult.value?.data ?? profileResult.value;
            setSlots(profile?.availability ?? []);
        } else {
            const status = profileResult.reason?.response?.status;
            if (status !== 404) {
                console.error('Coach profile:', profileResult.reason);
            }
            setSlots([]);
        }

        const criticalFailed =
            bookingsResult.status === 'rejected' && courtsResult.status === 'rejected';
        if (criticalFailed) {
            toastErrorRef.current('Failed to load schedule data.');
        }

        setLoading(false);
    };

    useEffect(() => {
        refreshAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount; avoid toastError dep loop
    }, []);

    const upcomingReservations = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return reservations.filter((b) => new Date(b.date) >= now).length;
    }, [reservations]);

    const sortedReservations = useMemo(
        () => [...reservations].sort((a, b) => new Date(a.date) - new Date(b.date)),
        [reservations]
    );

    const sortedSlots = useMemo(
        () =>
            [...slots].sort((a, b) => {
                const d = DAY_ORDER[a.day] - DAY_ORDER[b.day];
                return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
            }),
        [slots]
    );

    const selectedCourt = courts.find((c) => c._id === courtForm.courtId);

    const handleCourtSubmit = async (e) => {
        e.preventDefault();
        if (courtForm.startTime && courtForm.endTime && courtForm.endTime <= courtForm.startTime) {
            toastError('End hour must be after start hour.');
            return;
        }
        setCourtSubmitting(true);
        try {
            await coachService.createCourtBooking(courtForm);
            success('Court reserved. Add a weekly coaching slot next.');
            setCourtForm({ courtId: '', date: '', startTime: '', endTime: '' });
            setShowCourtForm(false);
            await refreshAll();
            setTab('weekly');
            setShowSlotForm(true);
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to reserve court');
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

    const onSlotSubmit = async (data) => {
        try {
            const payload = {
                day: data.day,
                startTime: data.startTime,
                endTime: data.endTime,
                courtBookingId: data.courtBookingId,
                maxStudents: parseInt(data.maxStudents, 10) || 1
            };
            const response = editingSlotId
                ? await coachService.updateAvailabilitySlot(editingSlotId, payload)
                : await coachService.addAvailabilitySlot(payload);
            if (response.success) {
                setSlots(response.data);
                resetSlot({ day: 'monday', maxStudents: 1, startTime: '09:00', endTime: '10:00', courtBookingId: '' });
                setShowSlotForm(false);
                setEditingSlotId(null);
                success(editingSlotId ? 'Slot updated.' : 'Weekly slot added.');
            }
        } catch (error) {
            toastError(error.response?.data?.error || 'Failed to save slot');
        }
    };

    const handleSlotDelete = async (id) => {
        if (!window.confirm('Delete this weekly slot?')) return;
        try {
            const response = await coachService.removeAvailabilitySlot(id);
            if (response.success) {
                setSlots(response.data);
                if (editingSlotId === id) {
                    setEditingSlotId(null);
                    setShowSlotForm(false);
                }
                success('Slot removed.');
            }
        } catch {
            toastError('Failed to delete slot');
        }
    };

    const openEditSlot = (slot) => {
        const bookingId = slot.courtBooking?._id?.toString?.() || slot.courtBooking?.toString?.() || '';
        setEditingSlotId(slot._id);
        setShowSlotForm(true);
        setTab('weekly');
        resetSlot({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            courtBookingId: bookingId,
            maxStudents: slot.maxStudents || 1
        });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-32 space-y-6"
        >
            {/* Hero */}
            <div className="relative overflow-hidden rounded-[2rem] shadow-xl shadow-emerald-900/10">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-800" />
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                <div className="relative px-6 sm:px-10 py-8 sm:py-9">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Coach schedule</p>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Courts & coaching availability
                    </h1>
                    <p className="mt-2 text-sm text-white/75 max-w-2xl font-medium">
                        Reserve a court, then attach weekly coaching slots to that booking so players can find and request sessions.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <div className="rounded-2xl bg-white/15 px-4 py-2.5 ring-1 ring-white/20 min-w-[100px]">
                            <p className="text-[10px] font-bold uppercase text-white/60">Reservations</p>
                            <p className="text-xl font-black text-white">{upcomingReservations}</p>
                        </div>
                        <div className="rounded-2xl bg-white/15 px-4 py-2.5 ring-1 ring-white/20 min-w-[100px]">
                            <p className="text-[10px] font-bold uppercase text-white/60">Weekly slots</p>
                            <p className="text-xl font-black text-white">{slots.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80 w-full sm:w-auto">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setTab(tab.id)}
                                className={twMerge(
                                    'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-bold transition-all',
                                    active
                                        ? 'bg-white text-slate-900 shadow-md'
                                        : 'text-slate-500 hover:text-slate-800'
                                )}
                            >
                                <Icon className={twMerge('h-5 w-5', active ? 'text-emerald-600' : 'text-slate-400')} />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.id === 'courts' ? 'Courts' : 'Weekly'}</span>
                            </button>
                        );
                    })}
                </div>
                {activeTab === 'courts' ? (
                    <Button
                        type="button"
                        onClick={() => setShowCourtForm(true)}
                        className="h-11 gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 lg:hidden"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Reserve court
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={() => {
                            setEditingSlotId(null);
                            resetSlot({ day: 'monday', maxStudents: 1, startTime: '09:00', endTime: '10:00', courtBookingId: '' });
                            setShowSlotForm((v) => !v);
                        }}
                        className="h-11 gap-2 font-bold bg-emerald-600 hover:bg-emerald-700"
                    >
                        <PlusIcon className="h-5 w-5" />
                        {showSlotForm && !editingSlotId ? 'Cancel' : 'Add weekly slot'}
                    </Button>
                )}
            </div>

            {/* Workflow hint on weekly tab when no courts */}
            {activeTab === 'weekly' && reservations.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm font-medium text-amber-900">
                        Step 1: Reserve a court before you can publish weekly coaching slots.
                    </p>
                    <button
                        type="button"
                        onClick={() => setTab('courts')}
                        className="text-sm font-bold text-amber-800 hover:underline shrink-0"
                    >
                        Go to court reservations →
                    </button>
                </div>
            )}

            <AnimatePresence mode="wait">
                {activeTab === 'courts' ? (
                    <motion.div
                        key="courts"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
                    >
                        <div className={twMerge('lg:col-span-5', !showCourtForm && 'max-lg:hidden')}>
                            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm overflow-hidden lg:sticky lg:top-28">
                                <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50/50 px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                                            <PlusIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-slate-900">New reservation</h2>
                                            <p className="text-xs text-slate-500">Hourly blocks</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCourtForm(false)}
                                        className="lg:hidden p-2 text-slate-400 rounded-xl hover:bg-slate-100"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                <form onSubmit={handleCourtSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                            Court
                                        </label>
                                        <select
                                            value={courtForm.courtId}
                                            onChange={(e) => setCourtForm({ ...courtForm, courtId: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                                            required
                                        >
                                            <option value="">Select court…</option>
                                            {courts.map((c) => (
                                                <option key={c._id} value={c._id}>
                                                    {c.name} — {c.location?.city}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedCourt && (
                                            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                                                <MapPinIcon className="h-3.5 w-3.5 text-emerald-600" />
                                                {selectedCourt.location?.city}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            min={todayStr}
                                            value={courtForm.date}
                                            onChange={(e) => setCourtForm({ ...courtForm, date: e.target.value })}
                                            className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <HourSlotSelect
                                            label="Start"
                                            value={courtForm.startTime}
                                            onChange={(v) => setCourtForm({ ...courtForm, startTime: v })}
                                        />
                                        <HourSlotSelect
                                            label="End"
                                            value={courtForm.endTime}
                                            onChange={(v) => setCourtForm({ ...courtForm, endTime: v })}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={courtSubmitting}
                                        isLoading={courtSubmitting}
                                        className="w-full h-11 font-bold bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        Confirm reservation
                                    </Button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-7 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Your reservations</h2>
                            {sortedReservations.length === 0 ? (
                                <EmptyCourts onReserve={() => setShowCourtForm(true)} />
                            ) : (
                                <ul className="space-y-3">
                                    {sortedReservations.map((b) => (
                                        <ReservationCard
                                            key={b._id}
                                            booking={b}
                                            onCancel={handleCourtCancel}
                                            onAddSlots={() => {
                                                setTab('weekly');
                                                setShowSlotForm(true);
                                            }}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="weekly"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        <AnimatePresence>
                            {showSlotForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm overflow-hidden"
                                >
                                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                                        <h2 className="font-bold text-slate-900">
                                            {editingSlotId ? 'Edit weekly slot' : 'Add weekly coaching slot'}
                                        </h2>
                                    </div>
                                    <form onSubmit={handleSlotSubmit(onSlotSubmit)} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                                Day
                                            </label>
                                            <select
                                                {...registerSlot('day', { required: true })}
                                                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold"
                                            >
                                                {DAYS.map((d) => (
                                                    <option key={d.value} value={d.value}>
                                                        {d.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                                Max students
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                {...registerSlot('maxStudents', { required: true, min: 1 })}
                                                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                                Linked court reservation
                                            </label>
                                            <select
                                                {...registerSlot('courtBookingId', { required: 'Reserve a court first' })}
                                                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold"
                                            >
                                                <option value="">Select reserved court…</option>
                                                {reservations.map((b) => {
                                                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                    const day = dayNames[new Date(b.date).getDay()];
                                                    return (
                                                        <option key={b._id} value={b._id}>
                                                            {b.court?.name} — {new Date(b.date).toLocaleDateString()} ({day}){' '}
                                                            {formatSlotHourRange(b.startTime, b.endTime)}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            {slotErrors.courtBookingId && (
                                                <p className="text-xs text-red-500 mt-1">{slotErrors.courtBookingId.message}</p>
                                            )}
                                            {reservations.length === 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setTab('courts')}
                                                    className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                                                >
                                                    Reserve a court first →
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                                Start hour
                                            </label>
                                            <Controller
                                                name="startTime"
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <FriendlyTimePicker value={field.value} onChange={field.onChange} />
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                                End hour
                                            </label>
                                            <Controller
                                                name="endTime"
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <FriendlyTimePicker value={field.value} onChange={field.onChange} />
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowSlotForm(false);
                                                    setEditingSlotId(null);
                                                }}
                                                className="px-4 h-11 text-sm font-bold text-slate-500"
                                            >
                                                Cancel
                                            </button>
                                            <Button type="submit" className="h-11 px-8 font-bold bg-emerald-600 hover:bg-emerald-700">
                                                {editingSlotId ? 'Save changes' : 'Save slot'}
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h2 className="font-bold text-slate-900">Weekly schedule</h2>
                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" />
                                    Repeats every week
                                </span>
                            </div>
                            {sortedSlots.length === 0 ? (
                                <motion.div className="p-12 text-center">
                                    <CalendarDaysIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <p className="font-bold text-slate-900">No weekly slots yet</p>
                                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                                        Link recurring coaching hours to a court you have reserved.
                                    </p>
                                    {reservations.length > 0 && (
                                        <Button
                                            type="button"
                                            onClick={() => setShowSlotForm(true)}
                                            className="mt-5 gap-2 h-11 font-bold bg-emerald-600"
                                        >
                                            <PlusIcon className="h-5 w-5" />
                                            Add first slot
                                        </Button>
                                    )}
                                </motion.div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {sortedSlots.map((slot) => (
                                        <li
                                            key={slot._id}
                                            className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold capitalize">
                                                        {slot.day}
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {formatSlotHourRange(slot.startTime, slot.endTime)}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-slate-500 flex items-center gap-1.5">
                                                    <MapPinIcon className="h-4 w-4 shrink-0" />
                                                    {slot.court?.name || 'Court'}
                                                    {slot.court?.location?.city && ` · ${slot.court.location.city}`}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Max {slot.maxStudents || 1} student{(slot.maxStudents || 1) > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditSlot(slot)}
                                                    className="p-2.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                                >
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSlotDelete(slot._id)}
                                                    className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

function EmptyCourts({ onReserve }) {
    return (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
            <BuildingOffice2Icon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-900">No reservations yet</p>
            <p className="text-sm text-slate-500 mt-1">Book a court to unlock weekly coaching slots.</p>
            <Button type="button" onClick={onReserve} className="mt-5 gap-2 h-11 font-bold bg-emerald-600">
                <PlusIcon className="h-5 w-5" />
                Reserve court
            </Button>
        </div>
    );
}

function ReservationCard({ booking, onCancel, onAddSlots }) {
    const date = new Date(booking.date);
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

    return (
        <li
            className={twMerge(
                'rounded-2xl border bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                isPast ? 'border-slate-100 opacity-70' : 'border-slate-200 hover:border-emerald-200'
            )}
        >
            <div className="flex gap-4 min-w-0">
                <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center shadow-md">
                    <span className="text-[10px] font-bold uppercase opacity-90">
                        {date.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-xl font-black leading-none">{date.getDate()}</span>
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-sm">
                            {date.toLocaleDateString(undefined, { weekday: 'long' })}
                        </p>
                        {!isPast && (
                            <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-100">
                                Upcoming
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {formatSlotHourRange(booking.startTime, booking.endTime)}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 truncate">
                        <MapPinIcon className="h-4 w-4 inline text-slate-400 mr-1" />
                        {booking.court?.name}
                    </p>
                    {booking.totalPrice != null && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <BanknotesIcon className="h-3.5 w-3.5" />
                            Rs. {booking.totalPrice}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {!isPast && (
                    <button
                        type="button"
                        onClick={onAddSlots}
                        className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-xl flex items-center gap-1"
                    >
                        Add slots
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onCancel(booking._id)}
                    className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
        </li>
    );
}

export default CoachSchedule;
