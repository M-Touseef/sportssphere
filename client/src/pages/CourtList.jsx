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
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">Elite Court Network</h1>
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-slate-500 font-medium leading-relaxed">
                        Discover and book professional-grade courts across the region.
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
                        <label htmlFor="city" className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 block ml-1">Location</label>
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
                        <label htmlFor="surfaceType" className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 block ml-1">Court Surface</label>
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
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {courts.map((court) => (
                            <motion.div
                                key={court._id}
                                layout
                                whileHover={{ y: -6 }}
                                className="group bg-white rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col h-full"
                            >
                                <div className="relative h-60 w-full overflow-hidden shrink-0">
                                    {court.images && court.images.length > 0 ? (
                                        <img
                                            src={court.images[0]}
                                            alt={court.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                            <SparklesIcon className="h-12 w-12 text-slate-200" />
                                        </div>
                                    )}

                                    {/* Top Left Badge: Surface */}
                                    <div className="absolute top-4 left-4 z-10">
                                        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                                            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600">
                                                {court.surfaceType}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Right Badge: Price Overlay */}
                                    <div className="absolute bottom-4 right-4 z-10">
                                        <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg flex flex-col items-end">
                                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Fee</p>
                                            <p className="text-xl font-bold text-white tracking-tight leading-none flex items-baseline gap-1">
                                                <span className="text-xs font-medium">Rs.</span>
                                                {court.pricePerHour}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-3 line-clamp-2">
                                            {court.name}
                                        </h3>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            <MapPinIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                                            {court.location.city}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-100/50 flex items-center justify-between">
                                        <div className="flex gap-2.5 items-center shrink-0">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">Available</span>
                                        </div>
                                        <Link to={`/courts/${court._id}`} className="shrink-0">
                                            <Button variant="outline" className="h-10 px-5 rounded-xl text-xs sm:text-sm font-bold border-slate-200 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2">
                                                Details
                                                <ArrowRightIcon className="h-4 w-4" />
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
