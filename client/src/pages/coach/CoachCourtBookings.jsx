import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import coachService from '../../services/coachService';
import { getAllCourts } from '../../services/courtService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { CalendarDaysIcon, MapPinIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import HourSlotSelect from '../../components/ui/HourSlotSelect';
import { formatSlotHourRange } from '../../utils/timeFormat';

const CoachCourtBookings = () => {
    const [reservations, setReservations] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { success, error: toastError } = useToast();
    const [form, setForm] = useState({
        courtId: '',
        date: '',
        startTime: '',
        endTime: ''
    });

    const load = async () => {
        try {
            const [resData, courtsData] = await Promise.all([
                coachService.getCourtBookings(),
                getAllCourts()
            ]);
            setReservations(resData.data || []);
            setCourts(courtsData.data || courtsData || []);
        } catch (err) {
            console.error(err);
            toastError('Failed to load court reservations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await coachService.createCourtBooking(form);
            success('Court reserved. You can now add coaching slots for this court.');
            setForm({ courtId: '', date: '', startTime: '', endTime: '' });
            setShowForm(false);
            load();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to reserve court');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this court reservation?')) return;
        try {
            await coachService.cancelCourtBooking(id);
            success('Reservation cancelled.');
            load();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to cancel');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Court reservations</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Book a court first, then offer coaching sessions on that specific court and time.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center px-4 py-2 rounded-xl font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Reserve court
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Court</label>
                        <select
                            value={form.courtId}
                            onChange={(e) => setForm({ ...form, courtId: e.target.value })}
                            className="w-full rounded-xl border-slate-300 py-2.5"
                            required
                        >
                            <option value="">Select court…</option>
                            {courts.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name} — {c.location?.city}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="w-full rounded-xl border-slate-300 py-2.5"
                            required
                        />
                    </div>
                    <HourSlotSelect
                        label="Start hour"
                        value={form.startTime}
                        onChange={(v) => setForm({ ...form, startTime: v })}
                    />
                    <HourSlotSelect
                        label="End hour"
                        value={form.endTime}
                        onChange={(v) => setForm({ ...form, endTime: v })}
                    />
                    <div className="md:col-span-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50"
                        >
                            {submitting ? 'Reserving…' : 'Confirm reservation'}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">Upcoming reservations</h2>
                    <Link to="/coach/availability" className="text-sm font-bold text-emerald-600 hover:underline">
                        Add coaching slots →
                    </Link>
                </div>
                {reservations.length === 0 ? (
                    <p className="p-8 text-center text-slate-500 text-sm">
                        No court reservations yet. Reserve a court before adding weekly coaching availability.
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {reservations.map((b) => (
                            <li
                                key={b._id}
                                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                        <CalendarDaysIcon className="h-4 w-4 text-emerald-600" />
                                        {new Date(b.date).toLocaleDateString(undefined, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                        <span className="text-slate-400 font-medium">
                                            {formatSlotHourRange(b.startTime, b.endTime)}
                                        </span>
                                    </div>
                                    <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                                        <MapPinIcon className="h-4 w-4" />
                                        {b.court?.name}, {b.court?.location?.city}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Court fee: Rs. {b.totalPrice}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCancel(b._id)}
                                    className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50"
                                    title="Cancel reservation"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CoachCourtBookings;
