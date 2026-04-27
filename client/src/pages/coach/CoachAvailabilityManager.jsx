import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import coachService from '../../services/coachService';
import { getAllCourts } from '../../services/courtService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { TrashIcon, MapPinIcon, PlusIcon, CalendarIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../context/ToastContext';

const CoachAvailabilityManager = () => {
    const [slots, setSlots] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState(null);
    const { success, error: toastError } = useToast();

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            day: 'monday',
            maxStudents: 1
        }
    });

    const days = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileData, courtsData] = await Promise.all([
                    coachService.getMyProfile(),
                    getAllCourts()
                ]);

                if (profileData.success) {
                    setSlots(profileData.data.availability || []);
                }
                setCourts(courtsData.data || courtsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                toastError('Failed to sync schedule.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const onSubmit = async (data) => {
        try {
            const payload = {
                day: data.day,
                startTime: data.startTime,
                endTime: data.endTime,
                court: data.court,
                maxStudents: parseInt(data.maxStudents, 10) || 1
            };

            let response;
            if (editingSlotId) {
                response = await coachService.updateAvailabilitySlot(editingSlotId, payload);
            } else {
                response = await coachService.addAvailabilitySlot(payload);
            }

            if (response.success) {
                setSlots(response.data);
                reset({ day: 'monday', maxStudents: 1, startTime: '', endTime: '', court: '' });
                setShowAddForm(false);
                setEditingSlotId(null);
                success(editingSlotId ? 'Slot updated.' : 'Weekly slot added.');
            }
        } catch (error) {
            console.error('Error saving slot:', error);
            toastError(error.response?.data?.error || 'Failed to save slot');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this weekly slot?')) return;
        try {
            const response = await coachService.removeAvailabilitySlot(id);
            if (response.success) {
                setSlots(response.data);
                if (editingSlotId === id) {
                    setEditingSlotId(null);
                    setShowAddForm(false);
                    reset({ day: 'monday', maxStudents: 1, startTime: '', endTime: '', court: '' });
                }
                success('Slot removed.');
            }
        } catch (error) {
            console.error('Error deleting slot:', error);
            toastError('Failed to delete slot');
        }
    };

    const openEditSlot = (slot) => {
        const courtId = slot.court?._id?.toString?.() || slot.court?.toString?.() || slot.court || '';
        setEditingSlotId(slot._id);
        setShowAddForm(true);
        reset({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            court: courtId,
            maxStudents: slot.maxStudents || 1
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleForm = () => {
        if (showAddForm) {
            reset({ day: 'monday', maxStudents: 1, startTime: '', endTime: '', court: '' });
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

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Coaching schedule</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage your recurring weekly training availability.</p>
                </div>
                <button
                    type="button"
                    onClick={toggleForm}
                    className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transition-colors ${showAddForm && !editingSlotId
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                >
                    {showAddForm && !editingSlotId ? (
                        'Cancel'
                    ) : (
                        <>
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add weekly slot
                        </>
                    )}
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in-down">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h3 className="text-lg font-bold text-slate-900">
                            {editingSlotId ? 'Edit weekly slot' : 'Add weekly coaching slot'}
                        </h3>
                        {editingSlotId && (
                            <button
                                type="button"
                                onClick={() => {
                                    reset({ day: 'monday', maxStudents: 1, startTime: '', endTime: '', court: '' });
                                    setEditingSlotId(null);
                                    setShowAddForm(false);
                                }}
                                className="text-sm font-medium text-slate-500 hover:text-slate-800"
                            >
                                Close
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Day of week</label>
                            <select
                                {...register('day', { required: 'Day is required' })}
                                className="block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm py-2.5"
                            >
                                {days.map(day => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start time</label>
                            <input
                                type="time"
                                {...register('startTime', { required: 'Start time is required' })}
                                className="block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm py-2.5"
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">End time</label>
                            <input
                                type="time"
                                {...register('endTime', { required: 'End time is required' })}
                                className="block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm py-2.5"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Court</label>
                            <select
                                {...register('court', { required: 'Court is required' })}
                                className="block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm py-2.5"
                            >
                                <option value="">Select a court…</option>
                                {courts.map(court => (
                                    <option key={court._id} value={court._id}>
                                        {court.name} — {court.location?.city}
                                    </option>
                                ))}
                            </select>
                            {errors.court && <span className="text-red-500 text-xs">{errors.court.message}</span>}
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Max capacity (students)</label>
                            <input
                                type="number"
                                min="1"
                                {...register('maxStudents', { required: 'Capacity is required', min: { value: 1, message: 'Minimum 1 student' } })}
                                className="block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm py-2.5"
                            />
                            {errors.maxStudents && <span className="text-red-500 text-xs">{errors.maxStudents.message}</span>}
                        </div>

                        <div className="col-span-2">
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        reset({ day: 'monday', maxStudents: 1, startTime: '', endTime: '', court: '' });
                                        setEditingSlotId(null);
                                        setShowAddForm(false);
                                    }}
                                    className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                                >
                                    {editingSlotId ? 'Save changes' : 'Save weekly slot'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">Your weekly schedule</h2>
                    <div className="text-xs text-slate-500 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                        <CalendarIcon className="h-4 w-4" />
                        Recurs every week
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {sortedSlots.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No recurring slots defined.
                        </div>
                    ) : (
                        sortedSlots.map(slot => (
                            <div key={slot._id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 capitalize">
                                            {slot.day}
                                        </span>
                                        <span className="text-sm font-medium text-slate-900">
                                            {slot.startTime} – {slot.endTime}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center text-sm text-slate-500 gap-y-2 gap-x-4 mt-2">
                                        <div className="flex items-center gap-1">
                                            <MapPinIcon className="h-4 w-4 text-slate-400 shrink-0" />
                                            {slot.court?.name || 'Court'}, {slot.court?.location?.city || ''}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                            <span>Max {slot.maxStudents || 1} {(slot.maxStudents || 1) > 1 ? 'students' : 'student'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => openEditSlot(slot)}
                                        className="p-2 text-slate-500 hover:text-emerald-600 transition-colors rounded-full hover:bg-emerald-50"
                                        title="Edit slot"
                                        aria-label="Edit slot"
                                    >
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(slot._id)}
                                        className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                                        title="Delete slot"
                                        aria-label="Delete slot"
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

export default CoachAvailabilityManager;
