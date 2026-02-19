import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import courtService from '../../services/courtService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';

export default function OrganizerCourts() {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { success, error } = useToast();

    useEffect(() => {
        fetchCourts();
    }, []);

    const fetchCourts = async () => {
        try {
            const data = await courtService.getMyCourts();
            setCourts(data.data);
        } catch (err) {
            console.error(err);
            error('Failed to load courts');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this court? This cannot be undone.')) return;
        try {
            await courtService.deleteCourt(id);
            success('Court deleted successfully');
            setCourts(courts.filter(c => c._id !== id));
        } catch (err) {
            error('Failed to delete court');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading your courts...</div>;

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Courts</h1>
                    <p className="text-slate-500">Manage your court listings</p>
                </div>
                <Link to="/courts/create">
                    <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <PlusIcon className="h-5 w-5" />
                        Add New Court
                    </Button>
                </Link>
            </div>

            {courts.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <MapPinIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No courts listed</h3>
                    <p className="text-slate-500 mb-6">Start by adding your first court.</p>
                    <Link to="/courts/create">
                        <Button variant="outline">Create Listing</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courts.map(court => (
                        <div key={court._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-video bg-slate-100 relative">
                                {court.images?.[0] ? (
                                    <img src={court.images[0]} alt={court.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <MapPinIcon className="h-12 w-12" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button
                                        onClick={() => handleDelete(court._id)}
                                        className="p-2 bg-white/90 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-slate-900 mb-1">{court.name}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-1">{court.location?.address}, {court.location?.city}</p>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-lg">
                                        <CurrencyDollarIcon className="h-4 w-4 text-slate-400" />
                                        Rs. {court.pricePerHour}/hr
                                    </span>
                                    <span className="text-slate-400 uppercase text-xs font-bold tracking-wider">{court.surfaceType}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
