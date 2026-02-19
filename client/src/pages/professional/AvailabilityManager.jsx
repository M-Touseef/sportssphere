import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getMyRecurringAvailability, addRecurringSlot, removeRecurringSlot } from '../../services/professionalService';
import { getAllCourts } from '../../services/courtService';
import AvailabilityToggle from '../../components/professional/AvailabilityToggle';
import LoadingSpinner from '../../components/LoadingSpinner';
import { TrashIcon, MapPinIcon, CalendarIcon, ClockIcon, PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { updateAvailability } from '../../services/professionalService';

const AvailabilityManager = () => {
    const [slots, setSlots] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Day enum matching backend
    const days = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' }
    ];

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            day: 'monday'
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [slotsData, courtsData] = await Promise.all([
                    getMyRecurringAvailability(),
                    getAllCourts()
                ]);

                if (slotsData.success) setSlots(slotsData.data);
                setCourts(courtsData.data || courtsData);
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
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHours = (hours + 1) % 24;
        return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const onSubmit = async (data) => {
        try {
            const court = courts.find(c => c._id === data.court);
            const endTime = calculateEndTime(data.startTime);

            const payload = {
                ...data,
                endTime,
                court: data.court,
                venue: {
                    name: court?.name,
                    city: court?.location?.city || 'Unknown',
                    address: court?.location?.address || 'Unknown'
                }
            };

            const response = await addRecurringSlot(payload);
            if (response.success) {
                setSlots(response.data); // Backend returns full updated list
                reset({ day: 'monday' });
                setShowAddForm(false);
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
                setSlots(response.data); // Backend returns full updated list
            }
        } catch (error) {
            console.error('Error deleting slot:', error);
            alert('Failed to delete slot');
        }
    };

    if (loading) return <LoadingSpinner />;

    // Sort slots by Day order then Time
    const dayOrder = { 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 7 };
    const sortedSlots = [...slots].sort((a, b) => {
        const dayDiff = dayOrder[a.day] - dayOrder[b.day];
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Weekly Availability</h1>
                    <p className="mt-1 text-sm text-slate-500">Set your recurring weekly schedule.</p>
                </div>
                <button
                    onClick={() => {
                        if (showAddForm) reset();
                        setShowAddForm(!showAddForm);
                    }}
                    className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transition-colors ${showAddForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                >
                    {showAddForm ? 'Cancel' : (
                        <>
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Weekly Slot
                        </>
                    )}
                </button>
            </div>

            {/* Add Slot Form */}
            {showAddForm && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fade-in-down">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Add Weekly Recurring Slot</h3>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Day of Week</label>
                            <select
                                {...register('day', { required: 'Day is required' })}
                                className="block w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                {days.map(day => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                ))}
                            </select>
                            {errors.day && <span className="text-red-500 text-xs">{errors.day.message}</span>}
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Court</label>
                            <select
                                {...register('court', { required: 'Court is required' })}
                                className="block w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">Select a court...</option>
                                {courts.map(court => (
                                    <option key={court._id} value={court._id}>
                                        {court.name} - {court.location?.city}
                                    </option>
                                ))}
                            </select>
                            {errors.court && <span className="text-red-500 text-xs">{errors.court.message}</span>}
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time (1 Hour Slot)</label>
                            <input
                                type="time"
                                {...register('startTime', { required: 'Start time is required' })}
                                className="block w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            {errors.startTime && <span className="text-red-500 text-xs">{errors.startTime.message}</span>}
                            <p className="mt-1 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                Slot will automatically end after 1 hour
                            </p>
                        </div>

                        <div className="col-span-2">
                            <div className="flex justify-end mt-4">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    Save Weekly Slot
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* List View */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">Your Weekly Schedule</h2>
                    <div className="text-xs text-slate-500 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                        <CalendarIcon className="h-4 w-4" />
                        Recurs every week
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {sortedSlots.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No active availability slots defined.
                        </div>
                    ) : (
                        sortedSlots.map(slot => (
                            <div key={slot._id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700 capitalize">
                                            {slot.day}
                                        </span>
                                        <span className="text-sm font-medium text-slate-900">
                                            {slot.startTime} - {slot.endTime}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center text-sm text-slate-500 gap-y-2 gap-x-4 mt-2">
                                        <div className="flex items-center gap-1">
                                            <MapPinIcon className="h-4 w-4 text-slate-400" />
                                            {slot.court?.name || slot.venue?.name}, {slot.court?.location?.city || slot.venue?.city}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-600 mr-2">{slot.isActive ? 'Active' : 'Inactive'}</span>
                                        {/* Toggle Logic could be added here similar to before if needed */}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDelete(slot._id)}
                                            className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                                            title="Remove Weekly Slot"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
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
