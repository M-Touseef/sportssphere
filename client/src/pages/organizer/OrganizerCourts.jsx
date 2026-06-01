import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    PlusIcon,
    TrashIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    EyeIcon,
    PencilSquareIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import courtService from '../../services/courtService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';

export default function OrganizerCourts() {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { success, error } = useToast();

    const fetchCourts = useCallback(async () => {
        try {
            const data = await courtService.getMyCourts();
            setCourts(data.data);
        } catch (err) {
            console.error(err);
            error('Failed to load courts');
        } finally {
            setLoading(false);
        }
    }, [error]);

    useEffect(() => {
        fetchCourts();
    }, [fetchCourts]);

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this court? This cannot be undone.')) return;
        try {
            await courtService.deleteCourt(id);
            success('Court deleted successfully');
            setCourts((prev) => prev.filter((c) => c._id !== id));
        } catch {
            error('Failed to delete court');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" aria-label="Loading courts" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-enter">
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-amber-500 p-6 sm:p-8 text-white shadow-lg">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-100">Venue management</p>
                        <h1 className="mt-2 text-3xl font-extrabold">My Courts</h1>
                        <p className="mt-2 max-w-xl text-sm text-white/90">Keep your listings accurate, inviting, and ready for player bookings.</p>
                    </div>
                    <Link to="/org/courts/create">
                        <Button className="flex h-12 items-center gap-2 bg-white px-5 text-indigo-700 shadow-lg shadow-indigo-900/10 hover:bg-indigo-50">
                            <PlusIcon className="h-5 w-5" />
                            Add New Court
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-950/5 text-indigo-950">
                        <BuildingOffice2Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Published venues</p>
                        <p className="text-2xl font-black text-slate-900">{courts.length}</p>
                    </div>
                </div>
                <p className="text-sm text-slate-500">Players see these listings when they search for a court.</p>
            </div>

            {courts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-amber-200 bg-gradient-to-br from-white to-amber-50/60 py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-950 text-amber-200 shadow-lg">
                        <MapPinIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No courts listed</h3>
                    <p className="mb-6 mt-2 text-slate-500">Add your first venue so players can discover and book it.</p>
                    <Link to="/org/courts/create">
                        <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Create Listing</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courts.map((court) => (
                        <div
                            key={court._id}
                            className="group/card flex flex-col overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-[0_16px_48px_-24px_rgba(30,27,75,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_24px_56px_-22px_rgba(30,27,75,0.24)]"
                        >
                            <Link to={`/courts/${court._id}`} className="block aspect-video bg-slate-100 relative group">
                                {court.images?.[0] ? (
                                    <img src={court.images[0]} alt={court.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <MapPinIcon className="h-12 w-12" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-indigo-950/0 group-hover:bg-indigo-950/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-indigo-950 shadow">
                                        <EyeIcon className="h-4 w-4" />
                                        View listing
                                    </span>
                                </div>
                            </Link>
                            <div className="p-5 flex-1 flex flex-col">
                                <Link to={`/courts/${court._id}`} className="block group">
                                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                        {court.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex items-start gap-1.5">
                                        <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                        {court.location?.address}, {court.location?.city}
                                    </p>
                                </Link>

                                <div className="flex items-center justify-between text-sm mt-auto pt-2 border-t border-slate-100">
                                    <span className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-950/5 to-amber-50 px-2.5 py-1 font-bold text-indigo-950">
                                        <CurrencyDollarIcon className="h-4 w-4 text-amber-700" />
                                        Rs. {court.pricePerHour}/hr
                                    </span>
                                    <span className="text-slate-400 uppercase text-xs font-bold tracking-wider">
                                        {court.surfaceType}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mt-4">
                                    <Link
                                        to={`/courts/${court._id}`}
                                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-100 py-2.5 text-sm font-semibold text-indigo-950 hover:bg-amber-50/60"
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                        View
                                    </Link>
                                    <Link
                                        to={`/org/courts/${court._id}/edit`}
                                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-950 py-2.5 text-sm font-semibold text-amber-50 hover:bg-indigo-900"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, court._id)}
                                        className="p-2.5 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50"
                                        title="Delete court"
                                        aria-label="Delete court"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
