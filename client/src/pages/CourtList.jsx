import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
    ArrowPathIcon,
    ArrowRightIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
    CheckBadgeIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    SparklesIcon,
    Squares2X2Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import courtService from '../services/courtService';
import { useToast } from '../context/ToastContext';
import { LAHORE_AREAS } from '../constants/lahoreAreas';

const COURT_HERO_IMAGE = '/images/homepage/indoor-badminton-court.jpg';

const SURFACE_LABELS = {
    synthetic: 'Mat / Synthetic',
    wooden: 'Wooden Floor',
    cement: 'Cement Floor',
    acrylic: 'Hard Court'
};

const CARD_ACCENTS = [
    {
        border: 'hover:border-sky-300',
        body: 'from-sky-50 via-white to-white',
        badge: 'bg-brand-sky text-brand-navy-deep',
        icon: 'bg-sky-100 text-sky-700'
    },
    {
        border: 'hover:border-lime-300',
        body: 'from-lime-50 via-white to-white',
        badge: 'bg-brand-lime text-brand-navy-deep',
        icon: 'bg-lime-100 text-lime-700'
    },
    {
        border: 'hover:border-brand-navy',
        body: 'from-slate-100 via-white to-sky-50',
        badge: 'bg-white text-brand-navy-deep',
        icon: 'bg-brand-navy text-brand-sky'
    }
];

const EMPTY_FILTERS = { area: '', surfaceType: '' };

const formatSurface = (type) =>
    SURFACE_LABELS[type] || type?.replace(/_/g, ' ') || 'Standard';

const CourtList = () => {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const { addToast } = useToast();
    const requestSequence = useRef(0);

    const fetchCourts = useCallback(
        async (activeFilters = EMPTY_FILTERS) => {
            const requestId = ++requestSequence.current;
            try {
                setLoading(true);
                setFetchError(false);
                const data = await courtService.getCourts(activeFilters);
                if (requestId !== requestSequence.current) return;
                setCourts(Array.isArray(data?.data) ? data.data : []);
            } catch (error) {
                if (requestId !== requestSequence.current) return;
                console.error('Error fetching courts:', error);
                setFetchError(true);
                addToast('Could not load courts. Please check your connection.', 'error');
            } finally {
                if (requestId === requestSequence.current) setLoading(false);
            }
        },
        [addToast]
    );

    useEffect(() => {
        requestSequence.current += 1;
        const timeoutId = setTimeout(() => {
            fetchCourts(filters);
        }, filters.area.trim() ? 250 : 0);

        return () => clearTimeout(timeoutId);
    }, [fetchCourts, filters]);

    const handleFilterChange = (event) => {
        setFilters((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    };

    const resetFilters = () => {
        setFilters({ ...EMPTY_FILTERS });
    };

    const hasActiveFilters = Boolean(filters.area.trim() || filters.surfaceType);

    const stats = useMemo(() => {
        const areas = new Set(courts.map((court) => court.location?.area).filter(Boolean));
        return { total: courts.length, areas: areas.size };
    }, [courts]);

    return (
        <div className="space-y-8 pb-20 sm:space-y-10">
            <section className="relative isolate overflow-hidden rounded-[2rem] bg-brand-navy-deep text-white shadow-2xl shadow-brand-navy/20 sm:rounded-[2.5rem]">
                <img
                    src={COURT_HERO_IMAGE}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-deep via-brand-navy-deep/95 to-brand-navy/45" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/80 via-transparent to-brand-sky/10" />
                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-sky/20 blur-3xl" aria-hidden />
                <div className="absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-brand-lime/15 blur-3xl" aria-hidden />

                <div className="relative grid min-h-[500px] items-center gap-8 px-6 py-9 sm:px-9 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-brand-sky/10 px-3.5 py-2 text-xs font-black text-sky-100 backdrop-blur-md">
                            <SparklesIcon className="h-4 w-4 text-brand-lime" />
                            Courts across Lahore
                        </div>
                        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                            Find your court.
                            <span className="block text-brand-lime">Own the next game.</span>
                        </h1>
                        <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-200 sm:text-base">
                            Explore quality badminton venues, compare hourly rates, and book a court that fits your location and playing style.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-xs font-bold backdrop-blur-sm">
                                <CheckBadgeIcon className="h-5 w-5 text-brand-lime" />
                                Verified venues
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-xs font-bold backdrop-blur-sm">
                                <BanknotesIcon className="h-5 w-5 text-brand-sky" />
                                Clear hourly pricing
                            </div>
                        </div>

                        {!loading && !fetchError && (
                            <div className="mt-8 flex gap-3">
                                <div className="min-w-28 rounded-2xl border border-sky-300/20 bg-sky-400/15 px-4 py-3 backdrop-blur-md">
                                    <p className="text-2xl font-black text-white">{stats.total}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-100">Courts found</p>
                                </div>
                                <div className="min-w-28 rounded-2xl border border-lime-300/20 bg-lime-400/15 px-4 py-3 backdrop-blur-md">
                                    <p className="text-2xl font-black text-white">{stats.areas}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-100">Lahore areas</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-[1.75rem] border border-white/15 bg-brand-navy-deep/75 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-lime">Court finder</p>
                                <h2 className="mt-1 text-2xl font-black">Search your way</h2>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-sky text-brand-navy-deep shadow-lg shadow-sky-500/20">
                                <FunnelIcon className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="area" className="mb-2 block text-xs font-black text-sky-100">
                                    Lahore area
                                </label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-sky" />
                                    <input
                                        type="search"
                                        name="area"
                                        id="area"
                                        list="lahore-area-options"
                                        className="h-13 w-full rounded-2xl border border-white/15 bg-white/10 pl-12 pr-4 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-400 focus:border-brand-sky focus:bg-white/15 focus:ring-4 focus:ring-sky-400/10"
                                        value={filters.area}
                                        onChange={handleFilterChange}
                                        placeholder="e.g. Johar Town"
                                        autoComplete="off"
                                    />
                                    <datalist id="lahore-area-options">
                                        {LAHORE_AREAS.map((area) => (
                                            <option key={area} value={area}>{area}</option>
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="surfaceType" className="mb-2 block text-xs font-black text-sky-100">
                                    Court surface
                                </label>
                                <select
                                    name="surfaceType"
                                    id="surfaceType"
                                    className="h-13 w-full rounded-2xl border border-white/15 bg-brand-navy px-4 text-sm font-bold text-white outline-none transition-all focus:border-brand-lime focus:ring-4 focus:ring-lime-400/10"
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
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
                            <p className="text-xs font-semibold text-slate-300">Results update automatically.</p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex shrink-0 items-center gap-1.5 text-xs font-black text-brand-lime transition-colors hover:text-lime-300"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-slate-50 to-lime-50/70 p-4 shadow-sm sm:p-7 lg:p-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                            <Squares2X2Icon className="h-4 w-4 text-brand-sky" />
                            Available venues
                        </div>
                        <h2 className="mt-3 text-2xl font-black tracking-tight text-brand-navy-deep sm:text-3xl">
                            Courts ready for your next match
                        </h2>
                        <p className="mt-2 text-sm font-medium text-slate-600">
                            Compare location, surface, and price before opening a court.
                        </p>
                    </div>

                    {!loading && !fetchError && (
                        <div className="rounded-2xl border border-sky-200 bg-white/70 px-4 py-3 text-right shadow-sm backdrop-blur-sm">
                            <p className="text-2xl font-black text-brand-navy-deep">{stats.total}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-700">
                                {hasActiveFilters ? 'Filtered results' : 'Total venues'}
                            </p>
                        </div>
                    )}
                </div>

                {hasActiveFilters && !loading && !fetchError && (
                    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-white/80 bg-white/65 p-3 backdrop-blur-sm">
                        <span className="mr-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Showing</span>
                        {filters.area.trim() && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-100 px-3 py-1.5 text-xs font-black text-sky-800">
                                <MapPinIcon className="h-3.5 w-3.5" />
                                {filters.area.trim()}
                            </span>
                        )}
                        {filters.surfaceType && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-200 bg-lime-100 px-3 py-1.5 text-xs font-black text-lime-800">
                                <SparklesIcon className="h-3.5 w-3.5" />
                                {formatSurface(filters.surfaceType)}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="ml-auto inline-flex items-center gap-1 text-xs font-black text-brand-navy transition-colors hover:text-sky-700"
                        >
                            Reset
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {loading ? (
                        <Motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {Array.from({ length: 6 }, (_, index) => (
                                <div key={index} className="overflow-hidden rounded-[1.75rem] border border-sky-100 bg-white/80 shadow-sm">
                                    <div className="h-52 animate-pulse bg-gradient-to-br from-brand-navy via-brand-navy to-sky-800" />
                                    <div className="space-y-4 p-5">
                                        <div className="h-5 w-2/3 animate-pulse rounded-full bg-sky-100" />
                                        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                                        <div className="h-10 animate-pulse rounded-xl bg-lime-100/70" />
                                    </div>
                                </div>
                            ))}
                        </Motion.div>
                    ) : fetchError ? (
                        <Motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex min-h-[390px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-rose-300 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-8 text-center"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                                <ExclamationTriangleIcon className="h-8 w-8" />
                            </div>
                            <h3 className="mt-5 text-2xl font-black text-brand-navy-deep">Couldn&apos;t load courts</h3>
                            <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-600">
                                Check your connection and try loading the available venues again.
                            </p>
                            <button
                                type="button"
                                onClick={() => fetchCourts(filters)}
                                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 text-sm font-black text-white shadow-lg shadow-brand-navy/15 transition-colors hover:bg-brand-navy-deep"
                            >
                                <ArrowPathIcon className="h-5 w-5" />
                                Retry
                            </button>
                        </Motion.div>
                    ) : courts.length > 0 ? (
                        <Motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {courts.map((court, index) => {
                                const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
                                const amenities = court.amenities?.slice(0, 2) || [];

                                return (
                                    <Motion.article
                                        key={court._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        whileHover={{ y: -6 }}
                                        className={`group flex flex-col overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[0_18px_45px_-24px_rgba(3,20,47,0.35)] transition-all duration-300 hover:shadow-[0_24px_55px_-22px_rgba(3,20,47,0.42)] ${accent.border}`}
                                    >
                                        <div className="relative h-56 overflow-hidden bg-brand-navy-deep">
                                            <img
                                                src={court.images?.[0] || COURT_HERO_IMAGE}
                                                alt={court.name}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep via-brand-navy/20 to-transparent" />
                                            {!court.images?.length && (
                                                <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-brand-navy-deep/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-sky-100 backdrop-blur-md">
                                                    <BuildingOffice2Icon className="h-4 w-4 text-brand-sky" />
                                                    Venue preview
                                                </div>
                                            )}

                                            <div className="absolute left-4 top-4">
                                                <span className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-lg ${accent.badge}`}>
                                                    {formatSurface(court.surfaceType)}
                                                </span>
                                            </div>

                                            <div className="absolute bottom-4 right-4 rounded-2xl border border-white/15 bg-brand-navy-deep/85 px-4 py-3 text-right shadow-xl backdrop-blur-md">
                                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-brand-sky">Per hour</p>
                                                <p className="mt-0.5 text-xl font-black text-white">
                                                    <span className="mr-1 text-xs text-slate-300">Rs.</span>
                                                    {court.pricePerHour?.toLocaleString?.() ?? court.pricePerHour}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`flex flex-1 flex-col bg-gradient-to-br p-5 ${accent.body}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.icon}`}>
                                                    <MapPinIcon className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-brand-navy-deep">
                                                        {court.name}
                                                    </h3>
                                                    <p className="mt-1 text-sm font-bold text-slate-600">
                                                        {court.location?.area || 'Area TBA'}, Lahore
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-5 flex flex-wrap gap-2">
                                                {(amenities.length ? amenities : ['Indoor venue', 'Online booking']).map((amenity) => (
                                                    <span
                                                        key={amenity}
                                                        className="rounded-full border border-white bg-white/75 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm"
                                                    >
                                                        {amenity}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                    Available
                                                </span>
                                                <Link
                                                    to={`/courts/${court._id}`}
                                                    className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-navy px-4 text-xs font-black text-white shadow-md shadow-brand-navy/15 transition-all hover:bg-brand-navy-deep"
                                                >
                                                    View court
                                                    <ArrowRightIcon className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </Motion.article>
                                );
                            })}
                        </Motion.div>
                    ) : (
                        <Motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid min-h-[410px] place-items-center overflow-hidden rounded-[1.75rem] border border-dashed border-sky-300 bg-brand-navy-deep p-8 text-center text-white"
                        >
                            <div className="relative z-10">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-lime text-brand-navy-deep shadow-lg shadow-lime-500/20">
                                    <MagnifyingGlassIcon className="h-8 w-8" />
                                </div>
                                <h3 className="mt-5 text-2xl font-black">No courts match those filters</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-300">
                                    Try another Lahore area or surface type, or reset the filters to see every available venue.
                                </p>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-sky px-5 text-sm font-black text-brand-navy-deep transition-colors hover:bg-sky-300"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                    Clear filters
                                </button>
                            </div>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
};

export default CourtList;
