import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    ArrowRightIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';

const SURFACE_LABELS = {
    synthetic: 'Mat / Synthetic',
    wooden: 'Wooden Floor',
    cement: 'Cement Floor',
    acrylic: 'Hard Court'
};

const formatSurface = (type) =>
    SURFACE_LABELS[type] || type?.replace(/_/g, ' ') || 'Standard';

const CourtList = () => {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const { error } = useToast();
    const [filters, setFilters] = useState({ city: '', surfaceType: '' });

    const fetchCourts = useCallback(
        async (activeFilters = filters) => {
            try {
                setLoading(true);
                setFetchError(false);
                const data = await courtService.getCourts(activeFilters);
                setCourts(Array.isArray(data?.data) ? data.data : []);
            } catch (err) {
                console.error('Error fetching courts:', err);
                setFetchError(true);
                error('Could not load courts. Please check your connection.');
            } finally {
                setLoading(false);
            }
        },
        [filters, error]
    );

    useEffect(() => {
        fetchCourts();
    }, []);

    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCourts(filters);
    };

    const resetFilters = () => {
        const cleared = { city: '', surfaceType: '' };
        setFilters(cleared);
        fetchCourts(cleared);
    };

    const hasActiveFilters = Boolean(filters.city.trim() || filters.surfaceType);

    const stats = useMemo(() => {
        const cities = new Set(
            courts.map((c) => c.location?.city).filter(Boolean)
        );
        return { total: courts.length, cities: cities.size };
    }, [courts]);

    return (
        <div className="pb-32">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.75rem] mb-10 sm:mb-12 border border-amber-200/60 shadow-[0_24px_70px_-28px_rgba(30,27,75,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-teal-900" />
                <div className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fbbf24\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M20 20h20v20H20V20zm-20 0h20v20H0V20z\'/%3E%3C/g%3E%3C/svg%3E')]" />

                <div className="relative px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 backdrop-blur-md border border-amber-300/30 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-100 mb-5">
                                <BuildingOffice2Icon className="h-4 w-4 text-amber-300" />
                                Court network
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                                Elite court
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-teal-200">
                                    discovery
                                </span>
                            </h1>
                            <p className="mt-4 text-base sm:text-lg text-indigo-100/85 font-medium leading-relaxed max-w-xl">
                                Find and book professional-grade venues across the region — filter by city and surface type.
                            </p>
                        </div>

                        {!loading && !fetchError && (
                            <div className="flex flex-wrap gap-3 lg:justify-end">
                                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-5 py-4 min-w-[6.5rem]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100/70">Listed</p>
                                    <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
                                </div>
                                <div className="rounded-2xl bg-teal-500/20 backdrop-blur-md border border-teal-300/25 px-5 py-4 min-w-[6.5rem]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-teal-100/80">Cities</p>
                                    <p className="text-2xl font-black text-white mt-1">{stats.cities}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Filters */}
            <div className="relative -mt-4 sm:-mt-6 mb-10 sm:mb-14 z-10">
                <div className="rounded-3xl sm:rounded-[2rem] bg-white/95 backdrop-blur-xl border border-amber-100/90 shadow-[0_20px_50px_-20px_rgba(30,27,75,0.15)] p-6 sm:p-8">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-end">
                        <div className="md:col-span-4">
                            <label
                                htmlFor="city"
                                className="text-[10px] font-bold text-amber-800/80 uppercase tracking-widest mb-2 block ml-1"
                            >
                                Location
                            </label>
                            <div className="relative">
                                <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-800 pointer-events-none" />
                                <input
                                    type="text"
                                    name="city"
                                    id="city"
                                    placeholder="Search city..."
                                    className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-slate-50 to-amber-50/40 font-semibold text-sm text-slate-900 focus:ring-4 focus:ring-amber-200/50 focus:border-amber-300/80 outline-none transition-all placeholder:text-slate-400"
                                    value={filters.city}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-5">
                            <label
                                htmlFor="surfaceType"
                                className="text-[10px] font-bold text-amber-800/80 uppercase tracking-widest mb-2 block ml-1"
                            >
                                Court surface
                            </label>
                            <select
                                name="surfaceType"
                                id="surfaceType"
                                className="w-full h-12 sm:h-14 px-5 rounded-2xl border border-amber-100 bg-gradient-to-br from-slate-50 to-amber-50/40 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-amber-200/50 focus:border-amber-300/80 outline-none transition-all"
                                value={filters.surfaceType}
                                onChange={handleFilterChange}
                            >
                                <option value="">All surface types</option>
                                <option value="synthetic">Mat / Synthetic</option>
                                <option value="wooden">Wooden Floor</option>
                                <option value="cement">Cement Floor</option>
                                <option value="acrylic">Hard Court</option>
                            </select>
                        </div>

                        <div className="md:col-span-3">
                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                className="min-h-[3rem] sm:min-h-[3.25rem] rounded-2xl font-bold text-base bg-indigo-950 hover:bg-indigo-900 text-amber-50 shadow-lg shadow-indigo-900/25 border-b-4 border-indigo-800 active:border-b-0 gap-2"
                            >
                                <MagnifyingGlassIcon className="h-5 w-5" />
                                Search courts
                            </Button>
                        </div>
                    </form>

                    {hasActiveFilters && !loading && (
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-800/70 uppercase tracking-widest">
                                Active filters
                            </span>
                            {filters.city.trim() && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-bold border border-amber-200">
                                    City: {filters.city.trim()}
                                </span>
                            )}
                            {filters.surfaceType && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-900 px-3 py-1 text-xs font-bold border border-indigo-200">
                                    {formatSurface(filters.surfaceType)}
                                </span>
                            )}
                            <span className="text-xs font-semibold text-slate-500 ml-auto">
                                {stats.total} result{stats.total === 1 ? '' : 's'}
                            </span>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-xs font-bold text-indigo-800 hover:text-indigo-950 underline underline-offset-2"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <CardSkeleton count={6} />
                    </motion.div>
                ) : fetchError ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-12 sm:p-16 flex flex-col items-center text-center rounded-[2rem] bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-dashed border-amber-200"
                    >
                        <ExclamationTriangleIcon className="h-14 w-14 text-amber-700 mb-5" />
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                            Couldn&apos;t load courts
                        </h3>
                        <p className="text-slate-600 max-w-sm font-medium mb-8">
                            Check your connection and try again.
                        </p>
                        <Button
                            onClick={() => fetchCourts(filters)}
                            className="px-10 h-12 bg-indigo-950 hover:bg-indigo-900 text-amber-50 font-bold rounded-2xl shadow-lg"
                        >
                            Retry
                        </Button>
                    </motion.div>
                ) : courts.length > 0 ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                    >
                        {courts.map((court, index) => (
                            <motion.article
                                key={court._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                whileHover={{ y: -6 }}
                                className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white border border-amber-100/90 shadow-[0_16px_48px_-20px_rgba(30,27,75,0.12)] hover:shadow-[0_24px_56px_-20px_rgba(30,27,75,0.2)] hover:border-amber-200/90 transition-all duration-300"
                            >
                                <div className="relative h-52 sm:h-56 overflow-hidden">
                                    {court.images?.length > 0 ? (
                                        <>
                                            <img
                                                src={court.images[0]}
                                                alt={court.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-indigo-950/20 to-transparent" />
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-indigo-900 to-teal-900 flex items-center justify-center">
                                            <BuildingOffice2Icon className="h-16 w-16 text-amber-400/30" />
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_50%)]" />
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-4 z-10">
                                        <span className="inline-block bg-amber-400/95 backdrop-blur-md text-indigo-950 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-amber-300/50 shadow-sm">
                                            {formatSurface(court.surfaceType)}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-4 right-4 z-10">
                                        <div className="bg-indigo-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-amber-300/30 shadow-lg">
                                            <p className="text-[10px] font-bold text-amber-300/90 uppercase tracking-widest leading-none mb-0.5">
                                                Per hour
                                            </p>
                                            <p className="text-xl font-black text-amber-50 tracking-tight leading-none">
                                                <span className="text-xs font-bold text-amber-200/80 mr-0.5">Rs.</span>
                                                {court.pricePerHour?.toLocaleString?.() ?? court.pricePerHour}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col border-t border-amber-50">
                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight line-clamp-2 group-hover:text-indigo-950 transition-colors mb-3">
                                        {court.name}
                                    </h3>

                                    <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-50 to-amber-50/60 border border-amber-100/80 px-3 py-2 text-sm font-bold text-indigo-900 w-fit">
                                        <MapPinIcon className="h-4 w-4 text-amber-700 shrink-0" />
                                        {court.location?.city || 'Location TBA'}
                                    </div>

                                    <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Available
                                        </span>
                                        <Link to={`/courts/${court._id}`} className="shrink-0">
                                            <Button
                                                variant="outline"
                                                className="h-10 px-5 rounded-xl text-xs font-bold border-amber-200 text-indigo-950 hover:bg-indigo-950 hover:border-indigo-950 hover:text-amber-50 transition-all gap-1.5"
                                            >
                                                View court
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <EmptyState
                            icon={SparklesIcon}
                            title="No courts found"
                            description="Try a different city or surface type, or clear your filters to see all venues."
                            actionLabel="Clear filters"
                            action={resetFilters}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CourtList;
