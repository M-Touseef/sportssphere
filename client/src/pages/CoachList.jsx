import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
    AcademicCapIcon,
    ArrowPathIcon,
    ArrowRightIcon,
    BuildingStorefrontIcon,
    CheckBadgeIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    UserGroupIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { getCoaches } from '../services/coachService';
import { getAllCourts } from '../services/courtService';
import { useToast } from '../context/ToastContext';
import { LAHORE_AREAS } from '../constants/lahoreAreas';

const COACHING_IMAGE = '/images/homepage/coaching-web.jpg';

const SPEC_LABELS = {
    singles: 'Singles',
    doubles: 'Doubles',
    footwork: 'Footwork',
    strategy: 'Strategy',
    fitness: 'Fitness',
    mental_game: 'Mental game'
};

const DEFAULT_FILTERS = {
    area: '',
    court: ''
};

const formatSpec = (specialization) =>
    SPEC_LABELS[specialization] || specialization?.replace(/_/g, ' ') || specialization;

const normalizeCourtId = (courtValue) => {
    if (!courtValue) return '';
    if (typeof courtValue === 'string') return courtValue;
    if (typeof courtValue === 'object') return courtValue._id || courtValue.id || '';
    return '';
};

const applyClientFilters = (coachList, activeFilters) => {
    const areaPrefix = activeFilters.area?.trim().toLowerCase();
    const selectedCourt = activeFilters.court?.trim();

    return coachList.filter((coach) => {
        const coachArea = coach.user?.area?.trim().toLowerCase() || '';
        if (areaPrefix && !coachArea.startsWith(areaPrefix)) return false;

        if (selectedCourt) {
            const hasCourtMatch =
                Array.isArray(coach.availability) &&
                coach.availability.some((slot) => normalizeCourtId(slot?.court) === selectedCourt);
            if (!hasCourtMatch) return false;
        }

        return true;
    });
};

const CoachList = () => {
    const [coaches, setCoaches] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const { addToast } = useToast();
    const requestSequence = useRef(0);

    const fetchCoaches = useCallback(
        async (activeFilters = DEFAULT_FILTERS) => {
            const requestId = ++requestSequence.current;
            try {
                setLoading(true);
                setFetchError(false);
                const data = await getCoaches(activeFilters);
                if (requestId !== requestSequence.current) return;
                setCoaches(applyClientFilters(data.data || [], activeFilters));
            } catch (error) {
                if (requestId !== requestSequence.current) return;
                console.error('Error fetching coaches:', error);
                setFetchError(true);
                addToast('Could not load coaches. Please check your connection.', 'error');
            } finally {
                if (requestId === requestSequence.current) setLoading(false);
            }
        },
        [addToast]
    );

    useEffect(() => {
        const loadCourts = async () => {
            try {
                const courtData = await getAllCourts();
                setCourts(Array.isArray(courtData?.data) ? courtData.data : courtData || []);
            } catch (error) {
                console.error('Error fetching coaching venues:', error);
            }
        };

        loadCourts();
    }, []);

    useEffect(() => {
        requestSequence.current += 1;
        const shouldDebounce = Boolean(filters.area.trim());
        const timeoutId = setTimeout(() => {
            fetchCoaches(filters);
        }, shouldDebounce ? 250 : 0);

        return () => clearTimeout(timeoutId);
    }, [fetchCoaches, filters]);

    const handleFilterChange = (event) => {
        setFilters((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    };

    const resetFilters = () => {
        setFilters({ ...DEFAULT_FILTERS });
    };

    const hasActiveFilters = Boolean(
        filters.area.trim() || filters.court
    );

    const selectedCourtName = useMemo(() => {
        if (!filters.court) return null;
        return courts.find((court) => court._id === filters.court)?.name || 'Selected venue';
    }, [courts, filters.court]);

    const stats = useMemo(() => {
        const monthlyPlans = coaches.filter((coach) => coach.monthlyFee != null).length;
        const areas = new Set(coaches.map((coach) => coach.user?.area).filter(Boolean)).size;
        return { total: coaches.length, monthlyPlans, areas };
    }, [coaches]);

    return (
        <div className="space-y-7 pb-20 sm:space-y-9">
            <section className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-brand-navy-deep shadow-[0_28px_70px_-35px_rgba(3,20,47,0.65)] lg:grid-cols-[1.08fr_0.92fr]">
                <div className="relative flex min-h-[390px] flex-col justify-center overflow-hidden px-6 py-10 text-white sm:px-10 lg:px-12">
                    <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-brand-sky/10 blur-3xl" aria-hidden />
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-brand-sky/10 px-3.5 py-2 text-xs font-black text-sky-100">
                            <AcademicCapIcon className="h-4 w-4 text-brand-sky" />
                            SportsSphere coaching
                        </div>
                        <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                            Find a coach who fits your game.
                        </h1>
                        <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
                            Compare coaching style, experience, location, and pricing before booking your next training session.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-200">
                                <CheckBadgeIcon className="h-5 w-5 text-emerald-400" />
                                Verified profiles
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-200">
                                <ClockIcon className="h-5 w-5 text-brand-sky" />
                                Flexible plans
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative min-h-80 overflow-hidden lg:min-h-full">
                    <img src={COACHING_IMAGE} alt="Badminton coach" className="absolute inset-0 h-full w-full object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-deep via-brand-navy-deep/15 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/70 via-transparent to-transparent" />

                    {!loading && !fetchError && (
                        <div className="absolute inset-x-5 bottom-5 grid grid-cols-3 gap-2 sm:inset-x-7 sm:bottom-7">
                            {[
                                { value: stats.total, label: 'Coaches' },
                                { value: stats.areas, label: 'Areas' },
                                { value: stats.monthlyPlans, label: 'Monthly' }
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-2xl border border-white/15 bg-brand-navy-deep/80 p-3 backdrop-blur-xl sm:p-4">
                                    <p className="text-2xl font-black text-white">{stat.value}</p>
                                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-sky-200">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-slate-100 p-4 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Dynamic coach search</p>
                        <h2 className="mt-1 text-2xl font-black text-brand-navy-deep">Search and refine</h2>
                    </div>
                    <p className="text-xs font-semibold text-slate-500">Results update as you type.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto]">
                    <div>
                        <label htmlFor="coach-area" className="sr-only">Search coaches by Lahore area</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-700" />
                            <input
                                id="coach-area"
                                type="search"
                                name="area"
                                list="coach-area-options"
                                value={filters.area}
                                onChange={handleFilterChange}
                                placeholder="Type an area"
                                autoComplete="off"
                                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm font-bold text-brand-navy-deep outline-none transition-all placeholder:text-slate-400 focus:border-brand-sky focus:ring-4 focus:ring-sky-200/60"
                            />
                            <datalist id="coach-area-options">
                                {LAHORE_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
                            </datalist>
                        </div>
                    </div>

                    <div className="relative">
                        <BuildingStorefrontIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                        <label htmlFor="coach-court" className="sr-only">Coaching venue</label>
                        <select
                            id="coach-court"
                            name="court"
                            value={filters.court}
                            onChange={handleFilterChange}
                            className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm font-bold text-brand-navy-deep outline-none transition-all focus:border-brand-sky focus:ring-4 focus:ring-sky-200/60"
                        >
                            <option value="">All venues</option>
                            {courts.map((court) => (
                                <option key={court._id} value={court._id}>{court.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={resetFilters}
                        disabled={!hasActiveFilters}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-brand-navy transition-colors hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <XMarkIcon className="h-4 w-4" />
                        Clear
                    </button>
                </div>

                {hasActiveFilters && (
                    <div className="mt-4 flex flex-wrap items-center gap-2" aria-live="polite">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Active</span>
                        {filters.area.trim() && (
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-800">Area starts with: {filters.area.trim()}</span>
                        )}
                        {selectedCourtName && (
                            <span className="max-w-52 truncate rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700">{selectedCourtName}</span>
                        )}
                    </div>
                )}
            </section>

            <section>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Coach directory</p>
                        <h2 className="mt-1 text-2xl font-black text-brand-navy-deep sm:text-3xl">Choose your training partner</h2>
                        <p className="mt-2 text-sm font-medium text-slate-600">Profiles are ordered by experience and recent activity.</p>
                    </div>
                    {!fetchError && (
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm" aria-live="polite">
                            <p className="text-2xl font-black text-brand-navy-deep">{loading ? '...' : stats.total}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Matching coaches</p>
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <Motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-5 lg:grid-cols-2">
                            {Array.from({ length: 4 }, (_, index) => (
                                <div key={index} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex gap-4">
                                        <div className="h-20 w-20 animate-pulse rounded-2xl bg-slate-200" />
                                        <div className="flex-1 space-y-3 pt-2">
                                            <div className="h-4 w-1/3 animate-pulse rounded-full bg-sky-100" />
                                            <div className="h-6 w-2/3 animate-pulse rounded-full bg-slate-200" />
                                            <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
                                        </div>
                                    </div>
                                    <div className="mt-5 h-20 animate-pulse rounded-xl bg-slate-100" />
                                </div>
                            ))}
                        </Motion.div>
                    ) : fetchError ? (
                        <Motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="grid min-h-[390px] place-items-center rounded-[1.75rem] border border-dashed border-rose-300 bg-rose-50 p-8 text-center"
                        >
                            <div>
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                                    <ExclamationTriangleIcon className="h-8 w-8" />
                                </div>
                                <h3 className="mt-5 text-2xl font-black text-brand-navy-deep">Couldn&apos;t load coaches</h3>
                                <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-slate-600">Check your connection and try the directory again.</p>
                                <button
                                    type="button"
                                    onClick={() => fetchCoaches(filters)}
                                    className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 text-sm font-black text-white transition-colors hover:bg-brand-navy-deep"
                                >
                                    <ArrowPathIcon className="h-5 w-5" />
                                    Retry
                                </button>
                            </div>
                        </Motion.div>
                    ) : coaches.length > 0 ? (
                        <Motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 lg:grid-cols-2">
                            {coaches.map((coach, index) => {
                                const specializations = Array.isArray(coach.specialization) ? coach.specialization : [];
                                const coachName = coach.user?.name || 'Coach';

                                return (
                                    <Motion.article
                                        key={coach._id}
                                        layout
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="group flex flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-30px_rgba(3,20,47,0.45)] transition-all hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_22px_50px_-28px_rgba(3,20,47,0.5)] sm:p-6"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-navy text-2xl font-black text-white ring-4 ring-slate-100">
                                                {coach.user?.profilePicture ? (
                                                    <img src={coach.user.profilePicture} alt={coachName} className="h-full w-full object-cover" />
                                                ) : coachName[0]?.toUpperCase() || 'C'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-sky-700 ring-1 ring-sky-100">
                                                        {coach.experience ?? 0} years experience
                                                    </span>
                                                    <CheckBadgeIcon className="h-5 w-5 text-emerald-500" aria-label="Verified coach" />
                                                </div>
                                                <h3 className="mt-2 truncate text-xl font-black tracking-tight text-brand-navy-deep sm:text-2xl">{coachName}</h3>
                                                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-500">
                                                    <MapPinIcon className="h-4 w-4 shrink-0 text-sky-600" />
                                                    {coach.user?.area || coach.user?.city || 'Lahore'}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-5 line-clamp-3 text-sm font-medium leading-6 text-slate-600">
                                            {coach.bio || `Experienced badminton coach focused on practical, structured training for players who want measurable improvement.`}
                                        </p>

                                        <div className="mt-4 flex min-h-7 flex-wrap gap-2">
                                            {specializations.slice(0, 3).map((specialization) => (
                                                <span key={specialization} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-600">
                                                    {formatSpec(specialization)}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="pr-4">
                                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Hourly</p>
                                                <p className="mt-1 text-lg font-black text-brand-navy-deep">Rs. {coach.hourlyRate?.toLocaleString?.() ?? coach.hourlyRate ?? '-'}</p>
                                            </div>
                                            <div className="pl-4">
                                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Monthly</p>
                                                <p className="mt-1 text-lg font-black text-brand-navy-deep">
                                                    {coach.monthlyFee != null ? `Rs. ${coach.monthlyFee.toLocaleString?.() ?? coach.monthlyFee}` : 'Not offered'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between gap-4 pt-5">
                                            <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <UserGroupIcon className="h-4 w-4 text-sky-600" />
                                                Personalized coaching
                                            </span>
                                            <Link
                                                to={`/coaches/${coach._id}`}
                                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 text-xs font-black text-white transition-colors hover:bg-brand-navy-deep"
                                            >
                                                View profile
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </Link>
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
                            className="relative grid min-h-[390px] place-items-center overflow-hidden rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-100 p-8 text-center"
                        >
                            <div className="relative">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-navy text-brand-sky">
                                    <MagnifyingGlassIcon className="h-8 w-8" />
                                </div>
                                <h3 className="mt-5 text-2xl font-black text-brand-navy-deep">No matching coaches</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-600">Try a shorter area prefix or another venue.</p>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 text-sm font-black text-white hover:bg-brand-navy-deep"
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

export default CoachList;
