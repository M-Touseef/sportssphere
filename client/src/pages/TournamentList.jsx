import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import {
    MapPinIcon,
    CalendarIcon,
    TrophyIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    SparklesIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { LAHORE_AREAS, LAHORE_CITY } from '../constants/lahoreAreas';

const STATUS_CONFIG = {
    draft: {
        label: 'Draft',
        badge: 'bg-slate-500/90 text-white border-white/20',
        accent: 'from-slate-500 to-slate-700',
        ring: 'ring-slate-200',
    },
    registration_open: {
        label: 'Registration open',
        badge: 'bg-emerald-500/95 text-white border-emerald-300/40',
        accent: 'from-emerald-500 via-teal-500 to-cyan-500',
        ring: 'ring-emerald-200',
    },
    registration_closed: {
        label: 'Registration closed',
        badge: 'bg-amber-500/95 text-white border-amber-300/40',
        accent: 'from-amber-500 via-orange-500 to-rose-500',
        ring: 'ring-amber-200',
    },
    in_progress: {
        label: 'In progress',
        badge: 'bg-violet-600/95 text-white border-violet-300/40',
        accent: 'from-violet-600 via-indigo-600 to-blue-600',
        ring: 'ring-violet-200',
    },
    completed: {
        label: 'Completed',
        badge: 'bg-slate-600/90 text-white border-slate-400/30',
        accent: 'from-slate-600 to-slate-800',
        ring: 'ring-slate-200',
    },
    cancelled: {
        label: 'Cancelled',
        badge: 'bg-rose-600/95 text-white border-rose-300/40',
        accent: 'from-rose-600 to-red-700',
        ring: 'ring-rose-200',
    },
};

const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

const DEFAULT_FILTERS = { area: '', status: '', upcoming: 'true' };

const normalizeFilters = ({ area = '', status = '', upcoming }) => ({
    area: typeof area === 'string' ? area.trim() : '',
    status: status || '',
    upcoming: status ? '' : upcoming === '' ? '' : 'true',
});

const minEntryFee = (tournament) => {
    const fees = (tournament.categories || [])
        .map((c) => c.entryFee)
        .filter((f) => typeof f === 'number');
    if (!fees.length) return null;
    return Math.min(...fees);
};

const TournamentList = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const { error } = useToast();
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [resultCount, setResultCount] = useState(null);

    const loadTournaments = useCallback(
        async (activeFilters) => {
            const queryFilters = normalizeFilters(activeFilters);
            try {
                setLoading(true);
                setFetchError(false);
                const data = await tournamentService.getTournaments(queryFilters);
                setTournaments(data.data || []);
                setResultCount(typeof data.count === 'number' ? data.count : (data.data || []).length);
            } catch (err) {
                console.error('Error fetching tournaments:', err);
                setFetchError(true);
                setResultCount(null);
                error('Failed to load tournaments. Please check your connection.');
            } finally {
                setLoading(false);
            }
        },
        [error]
    );

    useEffect(() => {
        loadTournaments(DEFAULT_FILTERS);
    }, [loadTournaments]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (e) => {
        const status = e.target.value;
        setFilters((prev) => {
            const next = { ...prev, status };
            loadTournaments(next);
            return next;
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const next = normalizeFilters({
            area: String(formData.get('area') ?? ''),
            status: String(formData.get('status') ?? ''),
            upcoming: 'true',
        });
        setFilters(next);
        loadTournaments(next);
    };

    const resetFilters = () => {
        const cleared = { area: '', status: '', upcoming: '' };
        setFilters(cleared);
        loadTournaments(cleared);
    };

    const hasActiveFilters = Boolean(filters.area.trim() || filters.status);

    const statusCounts = useMemo(() => {
        const counts = { open: 0, live: 0, total: tournaments.length };
        tournaments.forEach((t) => {
            if (t.status === 'registration_open') counts.open += 1;
            if (t.status === 'in_progress') counts.live += 1;
        });
        return counts;
    }, [tournaments]);

    const getStatusConfig = (status) =>
        STATUS_CONFIG[status] || STATUS_CONFIG.draft;

    const getTournamentArea = (tournament) =>
        tournament.area || tournament.court?.location?.area || tournament.city || LAHORE_CITY;

    return (
        <div className="pb-32">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.75rem] mx-4 sm:mx-6 lg:mx-8 mt-2 mb-10 sm:mb-12 border border-violet-200/60 shadow-[0_24px_80px_-24px_rgba(99,102,241,0.45)]">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600" />
                <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl" />
                <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />

                <div className="relative px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/95 mb-5">
                                <SparklesIcon className="h-4 w-4 text-amber-300" />
                                Championships hub
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                                Find your next
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200">
                                    tournament
                                </span>
                            </h1>
                            <p className="mt-4 text-base sm:text-lg text-indigo-100/90 font-medium leading-relaxed max-w-xl">
                                Discover and join badminton competitions near you — from local opens to regional showcases.
                            </p>
                        </div>

                        {!loading && !fetchError && (
                            <div className="flex flex-wrap gap-3 lg:justify-end">
                                <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 px-5 py-4 min-w-[7rem]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/80">Listed</p>
                                    <p className="text-2xl font-black text-white mt-1">{statusCounts.total}</p>
                                </div>
                                <div className="rounded-2xl bg-emerald-500/25 backdrop-blur-md border border-emerald-300/30 px-5 py-4 min-w-[7rem]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Open</p>
                                    <p className="text-2xl font-black text-white mt-1">{statusCounts.open}</p>
                                </div>
                                <div className="rounded-2xl bg-amber-500/25 backdrop-blur-md border border-amber-300/30 px-5 py-4 min-w-[7rem]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100">Live</p>
                                    <p className="text-2xl font-black text-white mt-1">{statusCounts.live}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Filters */}
                <div className="relative -mt-6 sm:-mt-8 mb-10 sm:mb-14 z-10">
                    <div className="rounded-3xl sm:rounded-[2rem] bg-white/90 backdrop-blur-xl border border-indigo-100 shadow-[0_20px_50px_-20px_rgba(79,70,229,0.2)] p-6 sm:p-8">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-end">
                            <div className="md:col-span-5">
                                <label className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-2 block ml-1">
                                    Lahore area
                                </label>
                                <div className="relative">
                                    <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-500 pointer-events-none" />
                                    <select
                                        name="area"
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-violet-100 bg-gradient-to-r from-violet-50/80 to-indigo-50/50 font-semibold text-sm text-slate-800 focus:ring-4 focus:ring-violet-500/15 focus:border-violet-400 outline-none transition-all"
                                        value={filters.area}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Lahore areas</option>
                                        {LAHORE_AREAS.map((area) => (
                                            <option key={area} value={area}>{area}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="md:col-span-4">
                                <label className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-2 block ml-1">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    className="w-full min-h-[3.25rem] px-5 rounded-2xl border-2 border-violet-100 bg-gradient-to-r from-violet-50/80 to-indigo-50/50 font-bold text-sm text-slate-800 focus:ring-4 focus:ring-violet-500/15 focus:border-violet-400 outline-none transition-all"
                                    value={filters.status}
                                    onChange={handleStatusChange}
                                >
                                    <option value="">All statuses</option>
                                    <option value="registration_open">Registration open</option>
                                    <option value="registration_closed">Registration closed</option>
                                    <option value="in_progress">In progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="md:col-span-3">
                                <Button
                                    type="submit"
                                    fullWidth
                                    size="lg"
                                    className="min-h-[3.25rem] rounded-2xl font-bold text-base bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:from-violet-700 hover:via-indigo-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-300/40 border-0 gap-2"
                                >
                                    <MagnifyingGlassIcon className="h-5 w-5" />
                                    Search
                                </Button>
                            </div>
                        </form>

                        {hasActiveFilters && !loading && (
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">
                                    Active filters
                                </span>
                                {filters.area?.trim() && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-800 px-3 py-1 text-xs font-bold">
                                        Area: {filters.area.trim()}
                                    </span>
                                )}
                                {filters.status && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-800 px-3 py-1 text-xs font-bold">
                                        {getStatusConfig(filters.status).label}
                                    </span>
                                )}
                                {resultCount != null && (
                                    <span className="text-xs font-semibold text-slate-500 ml-auto">
                                        {resultCount} result{resultCount === 1 ? '' : 's'}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="text-xs font-bold text-violet-600 hover:text-violet-800 underline underline-offset-2"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <Motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <CardSkeleton count={6} />
                        </Motion.div>
                    ) : fetchError ? (
                        <Motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-12 sm:p-16 flex flex-col items-center text-center rounded-[2.5rem] bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-dashed border-rose-200"
                        >
                            <ExclamationTriangleIcon className="h-14 w-14 text-rose-500 mb-5" />
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                                Couldn&apos;t load tournaments
                            </h3>
                            <p className="text-slate-600 max-w-sm font-medium mb-8">
                                Check your connection and try again.
                            </p>
                            <Button
                                onClick={() => loadTournaments(filters)}
                                className="px-10 h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200"
                            >
                                Retry
                            </Button>
                        </Motion.div>
                    ) : tournaments.length > 0 ? (
                        <Motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {tournaments.map((tournament, index) => {
                                const cfg = getStatusConfig(tournament.status);
                                const fee = minEntryFee(tournament);

                                return (
                                    <Motion.article
                                        key={tournament._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -6 }}
                                        className={twMerge(
                                            'group flex flex-col overflow-hidden rounded-[1.75rem] bg-white border-2 border-slate-100 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.12)] transition-all duration-300 hover:shadow-[0_28px_60px_-24px_rgba(99,102,241,0.35)] ring-2 ring-transparent hover:ring-violet-200/80',
                                            cfg.ring
                                        )}
                                    >
                                        <div className="relative h-52 overflow-hidden">
                                            {tournament.banner ? (
                                                <>
                                                    <img
                                                        src={tournament.banner}
                                                        alt={tournament.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                                                </>
                                            ) : (
                                                <div
                                                    className={twMerge(
                                                        'w-full h-full bg-gradient-to-br flex items-center justify-center',
                                                        cfg.accent
                                                    )}
                                                >
                                                    <TrophyIcon className="h-24 w-24 text-white/25" />
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
                                                </div>
                                            )}

                                            <span
                                                className={twMerge(
                                                    'absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-lg backdrop-blur-sm',
                                                    cfg.badge
                                                )}
                                            >
                                                {cfg.label}
                                            </span>

                                            {fee != null && (
                                                <div className="absolute bottom-4 left-4 rounded-xl bg-white/95 backdrop-blur px-3 py-1.5 shadow-md">
                                                    <p className="text-[9px] font-bold text-violet-600 uppercase tracking-widest leading-none">
                                                        From
                                                    </p>
                                                    <p className="text-sm font-black text-slate-900">Rs. {fee}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-xl font-black text-slate-900 leading-snug mb-4 group-hover:text-violet-700 transition-colors line-clamp-2">
                                                {tournament.name}
                                            </h3>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 rounded-xl bg-violet-50/80 border border-violet-100/80 px-3 py-2.5">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
                                                        <MapPinIcon className="h-4 w-4" />
                                                    </span>
                                                    <span className="line-clamp-1">
                                                        {tournament.venue}, {getTournamentArea(tournament)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 rounded-xl bg-amber-50/90 border border-amber-100/90 px-3 py-2.5">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                                                        <CalendarIcon className="h-4 w-4" />
                                                    </span>
                                                    <span>Starts {formatDate(tournament.startDate)}</span>
                                                </div>
                                                {(tournament.categories?.length ?? 0) > 0 && (
                                                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 rounded-xl bg-emerald-50/90 border border-emerald-100/90 px-3 py-2.5">
                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                                                            <UserGroupIcon className="h-4 w-4" />
                                                        </span>
                                                        <span>
                                                            {tournament.categories.length} categor
                                                            {tournament.categories.length === 1 ? 'y' : 'ies'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-3 pt-5 border-t border-slate-100 mt-auto">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                                                        {tournament.organizer?.name?.[0] || 'O'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                            Organizer
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-800 truncate">
                                                            {tournament.organizer?.name || 'TBD'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link to={`/tournaments/${tournament._id}`} className="shrink-0">
                                                    <span className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-md shadow-violet-200 transition-all group/btn">
                                                        View
                                                        <ArrowRightIcon className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </span>
                                                </Link>
                                            </div>
                                        </div>
                                    </Motion.article>
                                );
                            })}
                        </Motion.div>
                    ) : (
                        <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 border-2 border-dashed border-violet-200 p-4">
                                <EmptyState
                                    icon={TrophyIcon}
                                    title="No tournaments found"
                                    description="Try another Lahore area or status - new events are added regularly."
                                    actionLabel="Clear filters"
                                    action={resetFilters}
                                />
                            </div>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TournamentList;
