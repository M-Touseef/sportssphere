import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    getMyRecurringAvailability,
    addRecurringSlot,
    removeRecurringSlot,
    updateRecurringSlot
} from '../../services/professionalService';
import FriendlyTimePicker from '../../components/professional/FriendlyTimePicker';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
    TrashIcon,
    CalendarIcon,
    ClockIcon,
    PlusIcon,
    PencilSquareIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const AvailabilityManager = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState(null);

    const days = [
        { value: 'monday', label: 'Monday', short: 'Mon' },
        { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
        { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
        { value: 'thursday', label: 'Thursday', short: 'Thu' },
        { value: 'friday', label: 'Friday', short: 'Fri' },
        { value: 'saturday', label: 'Saturday', short: 'Sat' },
        { value: 'sunday', label: 'Sunday', short: 'Sun' }
    ];

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        defaultValues: {
            day: 'monday',
            startTime: '18:00'
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const slotsData = await getMyRecurringAvailability();
                if (slotsData.success) setSlots(slotsData.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const calculateEndTime = (startTime) => {
        if (!startTime) return '';
        const [hours] = startTime.split(':').map(Number);
        const endHours = (hours + 1) % 24;
        return `${String(endHours).padStart(2, '0')}:00`;
    };

    const buildPayload = (data) => ({
        day: data.day,
        startTime: data.startTime,
        endTime: calculateEndTime(data.startTime)
    });

    const onSubmit = async (data) => {
        try {
            const payload = buildPayload(data);
            const response = editingSlotId
                ? await updateRecurringSlot(editingSlotId, payload)
                : await addRecurringSlot(payload);
            if (response.success) {
                setSlots(response.data);
                reset({ day: 'monday', startTime: '18:00' });
                setShowAddForm(false);
                setEditingSlotId(null);
            }
        } catch (error) {
            console.error('Error saving slot:', error);
            alert(error.response?.data?.error || 'Failed to save slot');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this weekly slot?')) return;
        try {
            const response = await removeRecurringSlot(id);
            if (response.success) {
                setSlots(response.data);
                if (editingSlotId === id) {
                    setEditingSlotId(null);
                    setShowAddForm(false);
                    reset({ day: 'monday', startTime: '18:00' });
                }
            }
        } catch (error) {
            console.error('Error deleting slot:', error);
            alert('Failed to delete slot');
        }
    };

    const openEditSlot = (slot) => {
        setEditingSlotId(slot._id);
        setShowAddForm(true);
        reset({
            day: slot.day,
            startTime: slot.startTime || '18:00'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleForm = () => {
        if (showAddForm) {
            reset({ day: 'monday', startTime: '18:00' });
            setEditingSlotId(null);
        }
        setShowAddForm(!showAddForm);
    };

    if (loading) return <LoadingSpinner />;

    const dayOrder = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
    const sortedSlots = [...slots].sort((a, b) => {
        const dayDiff = dayOrder[a.day] - dayOrder[b.day];
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
    });

    // Count slots per day for the mini-calendar badges
    const slotsByDay = {};
    slots.forEach(s => { slotsByDay[s.day] = (slotsByDay[s.day] || 0) + 1; });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* ── Gradient Header ─────────────────────────────── */}
            <header className="relative bg-gradient-to-r from-indigo-600 to-amber-500 p-8 rounded-2xl shadow-lg text-white overflow-hidden">
                {/* Decorative shapes */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Weekly Availability</h1>
                        <p className="mt-1 text-sm opacity-90">
                            Set when you are free each week. Players choose the court when they send a request.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={toggleForm}
                        className={`inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                            showAddForm && !editingSlotId
                                ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                                : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-indigo-200'
                        }`}
                    >
                        {showAddForm && !editingSlotId ? (
                            'Cancel'
                        ) : (
                            <>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Add Weekly Slot
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* ── Mini Day Overview ───────────────────────────── */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-md border border-slate-100">
                <div className="grid grid-cols-7 gap-2">
                    {days.map(day => {
                        const count = slotsByDay[day.value] || 0;
                        return (
                            <div
                                key={day.value}
                                className={`text-center py-3 rounded-xl transition-all ${
                                    count > 0
                                        ? 'bg-indigo-50 border border-indigo-100'
                                        : 'bg-slate-50 border border-slate-100'
                                }`}
                            >
                                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">{day.short}</span>
                                <span className={`block text-lg font-extrabold mt-0.5 ${
                                    count > 0 ? 'text-indigo-600' : 'text-slate-300'
                                }`}>
                                    {count}
                                </span>
                                <span className="text-[10px] text-slate-400">{count === 1 ? 'slot' : 'slots'}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Info Banner ─────────────────────────────────── */}
            <div className="flex gap-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-amber-50 border border-indigo-100/60 text-sm text-indigo-900">
                <InformationCircleIcon className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
                <p className="font-medium leading-relaxed">
                    You only pick the day and time. The non-professional player selects the venue when booking a sparring session with you.
                </p>
            </div>

            {/* ── Add / Edit Form ─────────────────────────────── */}
            {showAddForm && (
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-slate-200 shadow-md p-6">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingSlotId ? '✏️ Edit weekly slot' : '➕ Add weekly recurring slot'}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {editingSlotId ? 'Modify the day or time for this slot.' : 'Choose a day and start time for your new availability.'}
                            </p>
                        </div>
                        {editingSlotId && (
                            <button
                                type="button"
                                onClick={() => {
                                    reset({ day: 'monday', startTime: '18:00' });
                                    setEditingSlotId(null);
                                    setShowAddForm(false);
                                }}
                                className="shrink-0 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                Close
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Day of week</label>
                                <select
                                    {...register('day', { required: 'Day is required' })}
                                    className="block w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2.5 bg-white"
                                >
                                    {days.map(day => (
                                        <option key={day.value} value={day.value}>{day.label}</option>
                                    ))}
                                </select>
                                {errors.day && <span className="text-red-500 text-xs mt-1">{errors.day.message}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Start time (1-hour session)</label>
                                <Controller
                                    name="startTime"
                                    control={control}
                                    rules={{ required: 'Start time is required' }}
                                    render={({ field }) => (
                                        <FriendlyTimePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            error={errors.startTime}
                                        />
                                    )}
                                />
                                {errors.startTime && (
                                    <span className="mt-1 block text-red-500 text-xs">{errors.startTime.message}</span>
                                )}
                                <p className="mt-2 text-xs text-slate-400">
                                    End time is set automatically one hour after start.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    reset({ day: 'monday', startTime: '18:00' });
                                    setEditingSlotId(null);
                                    setShowAddForm(false);
                                }}
                                className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                            >
                                {editingSlotId ? 'Save Changes' : 'Save Weekly Slot'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Schedule Table ──────────────────────────────── */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-slate-100 shadow-md overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900 text-lg">Your weekly schedule</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{slots.length} slot{slots.length !== 1 ? 's' : ''} configured</p>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <CalendarIcon className="h-4 w-4 text-indigo-500" />
                        Recurs every week
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {sortedSlots.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-amber-50 flex items-center justify-center mb-4 shadow-inner">
                                <CalendarIcon className="h-7 w-7 text-indigo-400" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">No availability slots yet</h3>
                            <p className="mt-1 text-sm text-slate-500">Click "Add Weekly Slot" to define when you're available.</p>
                        </div>
                    ) : (
                        sortedSlots.map(slot => (
                            <div
                                key={slot._id}
                                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    {/* Day badge */}
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-indigo-100 shrink-0">
                                        {slot.day.slice(0, 3)}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                            <span className="text-sm font-bold text-slate-900 capitalize">{slot.day}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                                                slot.isActive
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                            }`}>
                                                {slot.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                            <ClockIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                                            <span className="font-medium">{slot.startTime}</span>
                                            <span className="text-slate-300">–</span>
                                            <span className="font-medium">{slot.endTime}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Venue chosen by player when requesting
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => openEditSlot(slot)}
                                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-xl"
                                        title="Edit slot"
                                        aria-label="Edit slot"
                                    >
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(slot._id)}
                                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-xl"
                                        title="Remove weekly slot"
                                        aria-label="Remove weekly slot"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvailabilityManager;
