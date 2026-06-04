import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { getCoaches } from '../services/coachService';
import { getAllCourts } from '../services/courtService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import {
    AcademicCapIcon,
    MapPinIcon,
    MagnifyingGlassIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon,
    BuildingStorefrontIcon,
    BanknotesIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { LAHORE_AREAS } from '../constants/lahoreAreas';

const SPEC_LABELS = {
    singles: 'Singles',
    doubles: 'Doubles',
    footwork: 'Footwork',
    strategy: 'Strategy',
    fitness: 'Fitness',
    mental_game: 'Mental game'
};

const formatSpec = (spec) =>
    SPEC_LABELS[spec] || spec?.replace(/_/g, ' ') || spec;

const DEFAULT_FILTERS = {
    area: '',
    skillLevel: '',
    court: '',
    minRate: '',
    maxRate: '',
    paymentType: 'hourly'
};

const normalizeCourtId = (courtValue) => {
    if (!courtValue) return '';
    if (typeof courtValue === 'string') return courtValue;
    if (typeof courtValue === 'object') return courtValue._id || courtValue.id || '';
    return '';
};

const applyClientFilters = (coachList, activeFilters) => {
    const selectedArea = activeFilters.area?.trim().toLowerCase();
    const selectedCourt = activeFilters.court?.trim();
    const maxRate = activeFilters.maxRate !== '' ? Number(activeFilters.maxRate) : null;
    const paymentType = activeFilters.paymentType || 'hourly';

    return coachList.filter((coach) => {
        if (selectedArea && coach.user?.area?.trim().toLowerCase() !== selectedArea) {
            return false;
        }

        if (selectedCourt) {
            const hasCourtMatch =
                Array.isArray(coach.availability) &&
                coach.availability.some((slot) => normalizeCourtId(slot?.court) === selectedCourt);
            if (!hasCourtMatch) return false;
        }

        if (paymentType === 'monthly' && (coach.monthlyFee === null || coach.monthlyFee === undefined)) {
            return false;
        }

        if (maxRate !== null && !Number.isNaN(maxRate)) {
            const selectedRate =
                paymentType === 'monthly' ? Number(coach.monthlyFee) : Number(coach.hourlyRate);
            if (Number.isNaN(selectedRate) || selectedRate > maxRate) return false;
        }

        return true;
    });
};

const CoachList = () => {
    const [coaches, setCoaches] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const { error } = useToast();
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    const fetchCoaches = useCallback(
        async (activeFilters = filters) => {
            try {
                setLoading(true);
                setFetchError(false);
                const data = await getCoaches(activeFilters);
                setCoaches(applyClientFilters(data.data || [], activeFilters));
            } catch (err) {
                console.error('Error fetching coaches:', err);
                setFetchError(true);
                error('Could not load coaches. Please check your connection.');
            } finally {
                setLoading(false);
            }
        },
        [filters, error]
    );

    useEffect(() => {
        const initData = async () => {
            try {
                setLoading(true);
                setFetchError(false);
                const [coachesData, courtsData] = await Promise.all([
                    getCoaches(DEFAULT_FILTERS),
                    getAllCourts()
                ]);
                setCoaches(applyClientFilters(coachesData.data || [], DEFAULT_FILTERS));
                setCourts(Array.isArray(courtsData?.data) ? courtsData.data : courtsData || []);
            } catch (err) {
                console.error('Error fetching data:', err);
                setFetchError(true);
                error('Could not load coaches. Please check your connection.');
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, [error]);

    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCoaches(filters);
    };

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        fetchCoaches(DEFAULT_FILTERS);
    };

    const hasActiveFilters = Boolean(
        filters.area || filters.court || filters.maxRate !== '' || filters.paymentType !== 'hourly'
    );

    const selectedCourtName = useMemo(() => {
        if (!filters.court) return null;
        const court = courts.find((c) => c._id === filters.court);
        return court ? `${court.name}` : 'Selected hall';
    }, [filters.court, courts]);

    const stats = useMemo(() => {
        const withMonthly = coaches.filter((c) => c.monthlyFee != null).length;
        return { total: coaches.length, withMonthly };
    }, [coaches]);

    return (
        <div className="pb-32">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.75rem] mb-10 sm:mb-12 border border-amber-200/60 shadow-[0_24px_70px_-28px_rgba(30,27,75,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-900 to-indigo-900" />
                <div className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fbbf24\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M20 20h20v20H20V20zm-20 0h20v20H0V20z\'/%3E%3C/g%3E%3C/svg%3E')]" />

                <div className="relative px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 backdrop-blur-md border border-amber-300/30 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-100 mb-5">
                                <AcademicCapIcon className="h-4 w-4 text-amber-300" />
                                Coaching roster
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                                Performance
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-violet-200">
                                    mentors
                                </span>
                            </h1>
                            <p className="mt-4 text-base sm:text-lg text-indigo-100/85 font-medium leading-relaxed max-w-xl">
                                Book personalized sessions with certified coaches — filter by venue, fee plan, and budget.
                            </p>
                        </div>

                        {!loading && !fetchError && (
                            <div className="flex flex-wrap gap-3 lg:justify-end">
                                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-5 py-4 min-w-[6.5rem]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100/70">Coaches</p>
                                    <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
                                </div>
                                <div className="rounded-2xl bg-violet-500/20 backdrop-blur-md border border-violet-300/25 px-5 py-4 min-w-[6.5rem]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-100/80">Monthly plans</p>
                                    <p className="text-2xl font-black text-white mt-1">{stats.withMonthly}</p>
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
                        <div className="md:col-span-3">
                            <label className="text-[10px] font-bold text-amber-800/80 uppercase tracking-widest mb-2 block ml-1">
                                Lahore area
                            </label>
                            <div className="relative">
                                <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-800 pointer-events-none" />
                                <select
                                    name="area"
                                    className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-slate-50 to-amber-50/40 font-semibold text-sm text-slate-900 focus:ring-4 focus:ring-amber-200/50 focus:border-amber-300/80 outline-none transition-all appearance-none"
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

                        <div className="md:col-span-3">
                            <label className="text-[10px] font-bold text-amber-800/80 uppercase tracking-widest mb-2 block ml-1">
                                Location / hall
                            </label>
                            <div className="relative">
                                <BuildingStorefrontIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-800 pointer-events-none" />
                                <select
                                    name="court"
                                    className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-slate-50 to-amber-50/40 font-semibold text-sm text-slate-900 focus:ring-4 focus:ring-amber-200/50 focus:border-amber-300/80 outline-none transition-all appearance-none"
                                    value={filters.court}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All halls</option>
                                    {courts.map((court) => (
                                        <option key={court._id} value={court._id}>
                                            {court.name} — {court.location?.area || 'Lahore'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-amber-800/80 uppercase tracking-widest mb-2 block ml-1">
                                Fee plan
                            </label>
                            <select
                                name="paymentType"
                                className="w-full h-12 sm:h-14 px-5 rounded-2xl border border-amber-100 bg-gradient-to-br from-slate-50 to-amber-50/40 font-bold text-sm text-slate-900 focus:ring-4 focus:ring-amber-200/50 focus:border-amber-300/80 outline-none transition-all"
                                value={filters.paymentType}
                                onChange={handleFilterChange}
                            >
                                <option value="hourly">Hourly rate</option>
                                <option value="monthly">Monthly fee</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-amber-800/80 uppercase tracking-widest mb-2 block ml-1">
                                Max fee (PKR)
                            </label>
                            <div className="relative">
                                <BanknotesIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-800 pointer-events-none" />
                                <input
                                    type="number"
                                    name="maxRate"
                                    min="0"
                                    placeholder="Any"
                                    className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-slate-50 to-amber-50/40 font-semibold text-sm text-slate-900 focus:ring-4 focus:ring-amber-200/50 focus:border-amber-300/80 outline-none transition-all placeholder:text-slate-400"
                                    value={filters.maxRate}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                className="min-h-[3rem] sm:min-h-[3.25rem] rounded-2xl font-bold text-base bg-indigo-950 hover:bg-indigo-900 text-amber-50 shadow-lg shadow-indigo-900/25 border-b-4 border-indigo-800 active:border-b-0 gap-2"
                            >
                                <MagnifyingGlassIcon className="h-5 w-5" />
                                Search
                            </Button>
                        </div>
                    </form>

                    {hasActiveFilters && !loading && (
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-800/70 uppercase tracking-widest">
                                Active filters
                            </span>
                            {selectedCourtName && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-bold border border-amber-200 max-w-[200px] truncate">
                                    {selectedCourtName}
                                </span>
                            )}
                            {filters.area && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 px-3 py-1 text-xs font-bold border border-emerald-200">
                                    {filters.area}
                                </span>
                            )}
                            {filters.paymentType !== 'hourly' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-900 px-3 py-1 text-xs font-bold border border-violet-200">
                                    Monthly fee
                                </span>
                            )}
                            {filters.maxRate !== '' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-900 px-3 py-1 text-xs font-bold border border-indigo-200">
                                    Max Rs. {filters.maxRate}
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
                    <Motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <CardSkeleton count={6} />
                    </Motion.div>
                ) : fetchError ? (
                    <Motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-12 sm:p-16 flex flex-col items-center text-center rounded-[2rem] bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-dashed border-amber-200"
                    >
                        <ExclamationTriangleIcon className="h-14 w-14 text-amber-700 mb-5" />
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                            Couldn&apos;t load coaches
                        </h3>
                        <p className="text-slate-600 max-w-sm font-medium mb-8">
                            Check your connection and try again.
                        </p>
                        <Button
                            onClick={() => fetchCoaches(filters)}
                            className="px-10 h-12 bg-indigo-950 hover:bg-indigo-900 text-amber-50 font-bold rounded-2xl shadow-lg"
                        >
                            Retry
                        </Button>
                    </Motion.div>
                ) : coaches.length > 0 ? (
                    <Motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                    >
                        {coaches.map((coach, index) => {
                            const specs = Array.isArray(coach.specialization) ? coach.specialization : [];

                            return (
                                <Motion.article
                                    key={coach._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    whileHover={{ y: -6 }}
                                    className="group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-white border border-amber-100/90 shadow-[0_16px_48px_-20px_rgba(30,27,75,0.12)] hover:shadow-[0_24px_56px_-20px_rgba(30,27,75,0.2)] hover:border-amber-200/90 transition-all duration-300"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-violet-600" />

                                    {/* Header */}
                                    <div className="pl-6 pr-6 pt-7 pb-5 border-b border-amber-50/80 bg-gradient-to-br from-slate-50/50 to-amber-50/30">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 rounded-2xl bg-gradient-to-br from-indigo-950 to-violet-800 text-amber-200 flex items-center justify-center text-2xl sm:text-3xl font-black shadow-lg border border-indigo-800 group-hover:scale-105 transition-transform duration-300">
                                                {coach.user?.profilePicture ? (
                                                    <img
                                                        src={coach.user.profilePicture}
                                                        alt=""
                                                        className="h-full w-full rounded-2xl object-cover"
                                                    />
                                                ) : (
                                                    coach.user?.name?.[0]?.toUpperCase() || 'C'
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="inline-block text-[10px] font-bold text-amber-800/90 uppercase tracking-wider bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/80 mb-2">
                                                    {coach.experience ?? 0} yrs experience
                                                </span>
                                                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight truncate group-hover:text-indigo-950 transition-colors">
                                                    {coach.user?.name || 'Coach'}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-1.5 text-slate-600">
                                                    <MapPinIcon className="h-4 w-4 text-amber-700 shrink-0" />
                                                    <span className="text-xs font-bold truncate">
                                                        {coach.user?.area || coach.user?.city || 'Lahore'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio & specs */}
                                    <div className="px-6 py-5 pl-8 flex-1">
                                        <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4 line-clamp-3">
                                            {coach.bio ||
                                                `Certified coach with ${coach.experience ?? 0} years of technical and tactical training.`}
                                        </p>
                                        {specs.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {specs.slice(0, 3).map((spec, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="bg-gradient-to-r from-slate-50 to-amber-50/60 text-indigo-900 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-amber-100/80 uppercase tracking-wide"
                                                    >
                                                        {formatSpec(spec)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pricing */}
                                    <div className="px-6 pb-7 pl-8">
                                        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/5 to-amber-50 border border-amber-100/80 mb-5">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/60 mb-0.5">
                                                    Hourly
                                                </p>
                                                <p className="text-lg font-black text-indigo-950">
                                                    Rs. {coach.hourlyRate?.toLocaleString?.() ?? coach.hourlyRate ?? '—'}
                                                </p>
                                            </div>
                                            <div className="border-l border-amber-200/80 pl-3">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/60 mb-0.5">
                                                    Monthly
                                                </p>
                                                <p className="text-lg font-black text-emerald-800">
                                                    {coach.monthlyFee != null
                                                        ? `Rs. ${coach.monthlyFee.toLocaleString?.() ?? coach.monthlyFee}`
                                                        : '—'}
                                                </p>
                                            </div>
                                        </div>

                                        <Link to={`/coaches/${coach._id}`} className="block">
                                            <Button
                                                fullWidth
                                                className="h-12 rounded-xl font-bold bg-indigo-950 hover:bg-indigo-900 text-amber-50 shadow-lg shadow-indigo-900/20 border-b-4 border-indigo-800 active:border-b-0 gap-2 transition-all"
                                            >
                                                View profile
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </Motion.article>
                            );
                        })}
                    </Motion.div>
                ) : (
                    <Motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <EmptyState
                            icon={SparklesIcon}
                            title="No coaches found"
                            description="Try a different hall, fee plan, or max budget — or clear filters to see everyone."
                            actionLabel="Clear filters"
                            action={resetFilters}
                        />
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CoachList;
