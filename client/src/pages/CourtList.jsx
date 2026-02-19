import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import courtService from '../services/courtService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import {
    MapPinIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    SparklesIcon,
    AdjustmentsHorizontalIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const CourtList = () => {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const { error } = useToast();
    const [filters, setFilters] = useState({
        city: '',
        surfaceType: ''
    });

    useEffect(() => {
        fetchCourts();
    }, []);

    const fetchCourts = async () => {
        try {
            setLoading(true);
            setFetchError(false);
            const data = await courtService.getCourts(filters);
            setCourts(data.data);
        } catch (err) {
            console.error('Error fetching courts:', err);
            setFetchError(true);
            error('Registry sync failed. Tactical data is currently unavailable.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCourts();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 mb-10 sm:mb-16">
                <div className="max-w-3xl">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">Find Courts</h1>
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-slate-500 font-medium leading-relaxed">
                        Discover and book the best badminton courts in your area.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl font-bold bg-white shadow-sm border-slate-200">
                        <AdjustmentsHorizontalIcon className="h-5 w-5" />
                        Sort
                    </Button>
                </div>
            </div>

            {/* Search Filter */}
            <div className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 mb-10 sm:mb-16">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 items-end">
                    <div className="md:col-span-4">
                        <label htmlFor="city" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block ml-1">Location</label>
                        <div className="relative">
                            <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 pointer-events-none" />
                            <input
                                type="text"
                                name="city"
                                id="city"
                                placeholder="Search city..."
                                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-slate-50/30 font-semibold text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
                                value={filters.city}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-5">
                        <label htmlFor="surfaceType" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block ml-1">Court Condition</label>
                        <select
                            name="surfaceType"
                            id="surfaceType"
                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50/30 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 outline-none transition-all shadow-sm"
                            value={filters.surfaceType}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Surface Types</option>
                            <option value="synthetic">Mat / Synthetic</option>
                            <option value="wooden">Wooden Floor</option>
                            <option value="cement">Cement Floor</option>
                            <option value="acrylic">Hard Court</option>
                        </select>
                    </div>

                    <div className="md:col-span-3">
                        <Button type="submit" fullWidth size="lg" className="h-14 shadow-xl shadow-indigo-100 rounded-2xl font-bold text-base bg-slate-900 hover:bg-slate-800 text-white">
                            Search Courts
                        </Button>
                    </div>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <CardSkeleton count={6} />
                    </motion.div>
                ) : fetchError ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-20 flex flex-col items-center text-center bg-rose-50 border border-dashed border-rose-100 rounded-[3rem]"
                    >
                        <ExclamationTriangleIcon className="h-16 w-16 text-rose-500 opacity-20 mb-6" />
                        <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Unable to Load Courts</h3>
                        <p className="text-slate-500 max-w-sm font-medium mb-10">Something went wrong while loading the courts. Please try again.</p>
                        <Button onClick={fetchCourts} className="px-12 h-14 shadow-lg shadow-rose-100 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl">
                            Try Again
                        </Button>
                    </motion.div>
                ) : courts.length > 0 ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                    >
                        {courts.map((court) => (
                            <motion.div
                                key={court._id}
                                layout
                                whileHover={{ y: -8 }}
                                className="group bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_10px_40_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden transition-all duration-500 flex flex-col"
                            >
                                <div className="relative h-64 w-full overflow-hidden">
                                    {court.images && court.images.length > 0 ? (
                                        <img
                                            src={court.images[0]}
                                            alt={court.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                            <SparklesIcon className="h-20 w-20 text-slate-200" />
                                        </div>
                                    )}
                                    <div className="absolute top-6 left-6">
                                        <span className="px-5 py-2 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-sm uppercase tracking-wider bg-white/80 text-indigo-600 border-white/40">
                                            {court.surfaceType}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 sm:p-8 flex-1 flex flex-col">
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 sm:mb-6">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight uppercase tracking-tight break-words">
                                                {court.name}
                                            </h3>
                                        </div>
                                        <div className="text-left sm:text-right shrink-0">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fee</p>
                                            <p className="text-xl sm:text-2xl font-black text-indigo-600 tracking-tighter whitespace-nowrap">Rs. {court.pricePerHour}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-500 mb-10 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                        <MapPinIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                                        <span className="">{court.location.city}</span>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-slate-50 mt-auto">
                                        <div className="flex gap-2 items-center shrink-0">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available</span>
                                        </div>
                                        <Link to={`/courts/${court._id}`} className="shrink-0">
                                            <Button className="px-4 sm:px-8 rounded-xl h-11 sm:h-12 text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white shadow-sm transition-all flex items-center gap-2">
                                                View Details <ArrowRightIcon className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <EmptyState
                            icon={SparklesIcon}
                            title="No Courts Found"
                            description="We couldn't find any courts matching your search."
                            actionLabel="Clear Filters"
                            action={() => {
                                setFilters({ city: '', surfaceType: '' });
                                fetchCourts();
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CourtList;
