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
    MagnifyingGlassIcon,
    MapPinIcon,
    SparklesIcon,
    Squares2X2Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import courtService from '../services/courtService';
import { useToast } from '../context/ToastContext';
import { LAHORE_AREAS } from '../constants/lahoreAreas';

const COURT_IMAGE = '/images/homepage/indoor-badminton-court.jpg';

const SURFACE_LABELS = {
    synthetic: 'Mat / Synthetic',
    wooden: 'Wooden Floor',
    cement: 'Cement Floor',
    acrylic: 'Hard Court'
};

const SURFACE_OPTIONS = [
    { value: '', label: 'All courts' },
    { value: 'synthetic', label: 'Synthetic' },
    { value: 'wooden', label: 'Wooden' },
    { value: 'cement', label: 'Cement' },
    { value: 'acrylic', label: 'Hard court' }
];

const CARD_ACCENTS = [
    {
        line: 'bg-brand-sky',
        surface: 'border-sky-400/25 bg-sky-400/10 text-sky-100',
        icon: 'bg-brand-sky text-brand-navy-deep'
    },
    {
        line: 'bg-brand-lime',
        surface: 'border-lime-400/25 bg-lime-400/10 text-lime-100',
        icon: 'bg-brand-lime text-brand-navy-deep'
    },
    {
        line: 'bg-violet-400',
        surface: 'border-violet-400/25 bg-violet-400/10 text-violet-100',
        icon: 'bg-violet-400 text-brand-navy-deep'
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

    const handleAreaChange = (event) => {
        setFilters((previous) => ({ ...previous, area: event.target.value }));
    };

    const setSurface = (surfaceType) => {
        setFilters((previous) => ({ ...previous, surfaceType }));
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
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-brand-navy-deep text-white shadow-[0_30px_80px_-35px_rgba(3,20,47,0.8)] sm:rounded-[2.5rem]">
            <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-brand-sky/10 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-brand-lime/10 blur-3xl" aria-hidden />

            <section className="relative grid overflow-hidden border-b border-white/10 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="relative z-10 flex min-h-[360px] flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/20 bg-brand-sky/10 px-3.5 py-2 text-xs font-black text-sky-100">
                        <SparklesIcon className="h-4 w-4 text-brand-lime" />
                        Lahore court directory
                    </div>

                    <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                        Pick the right court.
                        <span className="block text-brand-lime">Play a better game.</span>
                    </h1>
                    <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
                        Compare venues by area, playing surface, facilities, and price without jumping between pages.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-3.5 py-2.5 text-xs font-bold text-sky-100 ring-1 ring-white/10">
                            <CheckBadgeIcon className="h-5 w-5 text-brand-lime" />
                            Verified venues
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-3.5 py-2.5 text-xs font-bold text-sky-100 ring-1 ring-white/10">
                            <BanknotesIcon className="h-5 w-5 text-brand-sky" />
                            Upfront pricing
                        </span>
                    </div>
                </div>

                <div className="relative min-h-72 overflow-hidden lg:min-h-full">
                    <img src={COURT_IMAGE} alt="Indoor badminton court" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-deep via-brand-navy-deep/30 to-transparent lg:from-brand-navy-deep/80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep via-transparent to-brand-sky/10" />

                    {!loading && !fetchError && (
                        <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-3 sm:inset-x-8 sm:bottom-8">
                            <div className="rounded-2xl border border-sky-300/20 bg-brand-navy-deep/80 p-4 backdrop-blur-xl">
                                <p className="text-3xl font-black text-white">{stats.total}</p>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-sky">Courts found</p>
                            </div>
                            <div className="rounded-2xl border border-lime-300/20 bg-brand-navy-deep/80 p-4 backdrop-blur-xl">
                                <p className="text-3xl font-black text-white">{stats.areas}</p>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-lime">Lahore areas</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="relative grid gap-5 p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-7 lg:p-8">
                <aside className="self-start rounded-[1.75rem] border border-sky-400/20 bg-brand-navy p-5 shadow-xl shadow-black/10 lg:sticky lg:top-28 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-sky">Refine results</p>
                            <h2 className="mt-1 text-xl font-black">Find your fit</h2>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-sky text-brand-navy-deep">
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-6">
                        <label htmlFor="area" className="mb-2 block text-xs font-black text-sky-100">Lahore area</label>
                        <div className="relative">
                            <MapPinIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-sky" />
                            <input
                                type="search"
                                name="area"
                                id="area"
                                list="lahore-area-options"
                                value={filters.area}
                                onChange={handleAreaChange}
                                placeholder="e.g. Johar Town"
                                autoComplete="off"
                                className="h-12 w-full rounded-xl border border-white/10 bg-brand-navy-deep pl-11 pr-3 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-500 focus:border-brand-sky focus:ring-4 focus:ring-sky-400/10"
                            />
                            <datalist id="lahore-area-options">
                                {LAHORE_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
                            </datalist>
                        </div>
                    </div>

                    <div className="mt-6">
                        <p className="mb-3 text-xs font-black text-sky-100">Playing surface</p>
                        <div className="grid grid-cols-2 gap-2">
                            {SURFACE_OPTIONS.map((option) => {
                                const selected = filters.surfaceType === option.value;
                                return (
                                    <button
                                        key={option.value || 'all'}
                                        type="button"
                                        onClick={() => setSurface(option.value)}
                                        aria-pressed={selected}
                                        className={`min-h-10 rounded-xl px-2.5 py-2 text-xs font-black transition-all ${
                                            selected
                                                ? 'bg-brand-lime text-brand-navy-deep shadow-lg shadow-lime-500/10'
                                                : 'border border-white/10 bg-white/5 text-slate-300 hover:border-sky-300/30 hover:bg-brand-sky/10 hover:text-white'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-brand-sky/10 text-xs font-black text-sky-100 transition-colors hover:bg-brand-sky/20"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            Clear all filters
                        </button>
                    )}

                    <div className="mt-6 rounded-2xl bg-brand-lime p-4 text-brand-navy-deep">
                        <BuildingOffice2Icon className="h-7 w-7" />
                        <p className="mt-3 font-black">Built for quick decisions</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-brand-navy/75">
                            Results update automatically as you search and select a surface.
                        </p>
                    </div>
                </aside>

                <main className="min-w-0 rounded-[1.75rem] border border-white/10 bg-[#071d3b] p-4 sm:p-6">
                    <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-brand-sky/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-brand-sky ring-1 ring-sky-300/15">
                                <Squares2X2Icon className="h-4 w-4" />
                                Court results
                            </div>
                            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Available venues</h2>
                            <p className="mt-2 text-sm font-medium text-slate-400">Compare every useful detail in one view.</p>
                        </div>

                        {!loading && !fetchError && (
                            <div className="flex items-center gap-3 rounded-2xl bg-brand-navy px-4 py-3 ring-1 ring-white/10">
                                <p className="text-3xl font-black text-brand-lime">{stats.total}</p>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Matching</p>
                                    <p className="text-xs font-black text-white">venue{stats.total === 1 ? '' : 's'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {hasActiveFilters && !loading && !fetchError && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Active</span>
                            {filters.area.trim() && (
                                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-black text-sky-100">
                                    {filters.area.trim()}
                                </span>
                            )}
                            {filters.surfaceType && (
                                <span className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1.5 text-xs font-black text-lime-100">
                                    {formatSurface(filters.surfaceType)}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="mt-5">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <Motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    {Array.from({ length: 3 }, (_, index) => (
                                        <div key={index} className="grid overflow-hidden rounded-[1.5rem] border border-white/10 bg-brand-navy md:grid-cols-[240px_1fr]">
                                            <div className="min-h-52 animate-pulse bg-gradient-to-br from-sky-900 to-brand-navy-deep" />
                                            <div className="space-y-4 p-5">
                                                <div className="h-5 w-2/3 animate-pulse rounded-full bg-white/10" />
                                                <div className="h-10 animate-pulse rounded-xl bg-white/5" />
                                                <div className="h-10 animate-pulse rounded-xl bg-lime-400/10" />
                                            </div>
                                        </div>
                                    ))}
                                </Motion.div>
                            ) : fetchError ? (
                                <Motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="grid min-h-[440px] place-items-center rounded-[1.5rem] border border-dashed border-rose-400/30 bg-rose-400/5 p-8 text-center"
                                >
                                    <div>
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-400/15 text-rose-300">
                                            <ExclamationTriangleIcon className="h-8 w-8" />
                                        </div>
                                        <h3 className="mt-5 text-2xl font-black">Courts could not be loaded</h3>
                                        <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-slate-400">Check your connection and try again.</p>
                                        <button
                                            type="button"
                                            onClick={() => fetchCourts(filters)}
                                            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-lime px-5 text-sm font-black text-brand-navy-deep hover:bg-lime-300"
                                        >
                                            <ArrowPathIcon className="h-5 w-5" />
                                            Retry
                                        </button>
                                    </div>
                                </Motion.div>
                            ) : courts.length > 0 ? (
                                <Motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                    {courts.map((court, index) => {
                                        const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
                                        const amenities = court.amenities?.slice(0, 3) || [];

                                        return (
                                            <Motion.article
                                                key={court._id}
                                                layout
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                className="group relative grid overflow-hidden rounded-[1.5rem] border border-white/10 bg-brand-navy shadow-xl shadow-black/10 transition-all hover:border-sky-300/25 md:grid-cols-[250px_minmax(0,1fr)]"
                                            >
                                                <div className={`absolute inset-y-0 left-0 z-20 w-1 ${accent.line}`} aria-hidden />
                                                <div className="relative min-h-56 overflow-hidden md:min-h-full">
                                                    <img
                                                        src={court.images?.[0] || COURT_IMAGE}
                                                        alt={court.name}
                                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/90 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-brand-navy/50" />
                                                    {!court.images?.length && (
                                                        <span className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-brand-navy-deep/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-sky-100 backdrop-blur-md">
                                                            Venue preview
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex min-w-0 flex-col p-5 sm:p-6">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="min-w-0">
                                                            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${accent.surface}`}>
                                                                {formatSurface(court.surfaceType)}
                                                            </span>
                                                            <h3 className="mt-3 text-xl font-black leading-tight tracking-tight text-white sm:text-2xl">{court.name}</h3>
                                                            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-300">
                                                                <MapPinIcon className="h-4 w-4 shrink-0 text-brand-sky" />
                                                                {court.location?.area || 'Area TBA'}, Lahore
                                                            </p>
                                                        </div>
                                                        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-200">
                                                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                                            Available
                                                        </span>
                                                    </div>

                                                    <div className="mt-5 flex flex-wrap gap-2">
                                                        {(amenities.length ? amenities : ['Indoor venue', 'Online booking']).map((amenity) => (
                                                            <span key={amenity} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-300 ring-1 ring-white/10">
                                                                {amenity}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="mt-auto flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Hourly rate</p>
                                                            <p className="mt-1 text-2xl font-black text-brand-lime">
                                                                <span className="mr-1 text-xs text-lime-200">Rs.</span>
                                                                {court.pricePerHour?.toLocaleString?.() ?? court.pricePerHour}
                                                            </p>
                                                        </div>
                                                        <Link
                                                            to={`/courts/${court._id}`}
                                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-sky px-5 text-sm font-black text-brand-navy-deep shadow-lg shadow-sky-500/10 transition-colors hover:bg-sky-300"
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
                                    className="relative grid min-h-[440px] place-items-center overflow-hidden rounded-[1.5rem] border border-dashed border-sky-400/25 p-8 text-center"
                                >
                                    <img src={COURT_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" aria-hidden />
                                    <div className="absolute inset-0 bg-brand-navy-deep/85" />
                                    <div className="relative">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-sky text-brand-navy-deep">
                                            <MagnifyingGlassIcon className="h-8 w-8" />
                                        </div>
                                        <h3 className="mt-5 text-2xl font-black">No matching courts</h3>
                                        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-400">Try another area or playing surface to broaden the results.</p>
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-lime px-5 text-sm font-black text-brand-navy-deep hover:bg-lime-300"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                            Reset filters
                                        </button>
                                    </div>
                                </Motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CourtList;
