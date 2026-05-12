import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCoaches } from '../services/coachService';
import { getAllCourts } from '../services/courtService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import {
    AcademicCapIcon,
    MapPinIcon,
    StarIcon,
    AdjustmentsHorizontalIcon,
    MagnifyingGlassIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon,
    BuildingStorefrontIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

const CoachList = () => {
    const [coaches, setCoaches] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const { error } = useToast();
    const [filters, setFilters] = useState({
        city: '',
        skillLevel: '',
        court: '',
        minRate: '',
        maxRate: '',
        paymentType: 'hourly' // hourly or monthly
    });

    const normalizeCourtId = (courtValue) => {
        if (!courtValue) return '';
        if (typeof courtValue === 'string') return courtValue;
        if (typeof courtValue === 'object') return courtValue._id || courtValue.id || '';
        return '';
    };

    const applyClientFilters = (coachList, activeFilters) => {
        const selectedCourt = activeFilters.court?.trim();
        const maxRate = activeFilters.maxRate !== '' ? Number(activeFilters.maxRate) : null;
        const paymentType = activeFilters.paymentType || 'hourly';

        return coachList.filter((coach) => {
            if (selectedCourt) {
                const hasCourtMatch = Array.isArray(coach.availability) && coach.availability.some((slot) => (
                    normalizeCourtId(slot?.court) === selectedCourt
                ));

                if (!hasCourtMatch) return false;
            }

            if (paymentType === 'monthly' && (coach.monthlyFee === null || coach.monthlyFee === undefined)) {
                return false;
            }

            if (maxRate !== null && !Number.isNaN(maxRate)) {
                const selectedRate = paymentType === 'monthly'
                    ? Number(coach.monthlyFee)
                    : Number(coach.hourlyRate);

                if (Number.isNaN(selectedRate) || selectedRate > maxRate) {
                    return false;
                }
            }

            return true;
        });
    };

    useEffect(() => {
        const initData = async () => {
            try {
                const [coachesData, courtsData] = await Promise.all([
                    getCoaches(filters),
                    getAllCourts()
                ]);
                setCoaches(applyClientFilters(coachesData.data || [], filters));
                setCourts(courtsData.data || courtsData);
            } catch (err) {
                console.error('Error fetching data:', err);
                setFetchError(true);
                error('Data synchronization failed.');
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, []);

    const fetchCoaches = async (activeFilters = filters) => {
        try {
            setLoading(true);
            setFetchError(false);
            const data = await getCoaches(activeFilters);
            setCoaches(applyClientFilters(data.data || [], activeFilters));
        } catch (err) {
            console.error('Error fetching coaches:', err);
            setFetchError(true);
            error('Coach database synchronization failed.');
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
        fetchCoaches(filters);
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <StarIcon
                        key={i}
                        className={twMerge(
                            "h-3 w-3",
                            i < Math.round(rating) ? "text-amber-400 fill-current" : "text-slate-200"
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-10 mb-10 sm:mb-16">
                <div className="max-w-3xl">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">Performance Mentors</h1>
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-slate-500 font-medium leading-relaxed">
                        Accelerate your technical mastery with personalized mentorship from world-class pro-circuit coaches.
                    </p>
                </div>
            </div>

            {/* Matrix Search Filter */}
            <div className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.04)] border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 mb-10 sm:mb-16">
                <form onSubmit={handleSearch} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Location / Hall</label>
                            <div className="relative">
                                <BuildingStorefrontIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 pointer-events-none" />
                                <select
                                    name="court"
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-slate-50/50 font-semibold text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none"
                                    value={filters.court}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Halls</option>
                                    {courts.map(court => (
                                        <option key={court._id} value={court._id}>{court.name} - {court.location?.city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="md:col-span-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Fee Plan</label>
                            <select
                                name="paymentType"
                                className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                value={filters.paymentType}
                                onChange={handleFilterChange}
                            >
                                <option value="hourly">Hourly Rate</option>
                                <option value="monthly">Monthly Fee</option>
                            </select>
                        </div>

                        <div className="md:col-span-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Max Fee (PKR)</label>
                            <div className="relative">
                                <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 pointer-events-none" />
                                <input
                                    type="number"
                                    name="maxRate"
                                    placeholder="Any"
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-slate-50/50 font-semibold text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                                    value={filters.maxRate}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <Button type="submit" fullWidth size="lg" className="h-14 shadow-xl shadow-indigo-100 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white">
                                Filter
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loader">
                        <CardSkeleton count={6} />
                    </motion.div>
                ) : fetchError ? (
                    <motion.div
                        key="error"
                        className="p-24 flex flex-col items-center text-center bg-rose-50 border border-rose-100 rounded-[3rem]"
                    >
                        <ExclamationTriangleIcon className="h-16 w-16 text-rose-300 mb-6" />
                        <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Desync</h3>
                        <p className="text-slate-500 max-w-sm font-medium mt-2">Mentor synchronization failed. Please refresh your operational uplink.</p>
                        <Button onClick={fetchCoaches} className="mt-8 px-10 h-12 shadow-lg shadow-rose-100 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl">
                            Retry Uplink
                        </Button>
                    </motion.div>
                ) : coaches.length > 0 ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                    >
                        {coaches.map((coach) => (
                            <motion.div
                                key={coach._id}
                                whileHover={{ y: -8 }}
                                className="group bg-white rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all duration-500 flex flex-col h-full"
                            >
                                {/* Card Header - Identity & Rating */}
                                <div className="p-8 pb-6 flex items-center gap-6">
                                    <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center text-3xl sm:text-4xl font-black shadow-xl shadow-indigo-100 ring-4 ring-white group-hover:scale-105 transition-transform duration-500">
                                        {coach.user?.name?.[0]?.toUpperCase() || 'C'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                                <StarIcon className="h-3 w-3 text-amber-500 fill-current" />
                                                <span className="text-[11px] font-bold text-amber-700">{coach.rating.average.toFixed(2)}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{coach.rating.count} Sessions</span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight truncate">
                                            {coach.user?.name || 'Coach'}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                                            <MapPinIcon className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest truncate">{coach.user?.city || 'Unknown'} Division</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="px-8 pb-6 flex-1">
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                                        {coach.bio || `Specialized mentor with ${coach.experience} years of intensive tactical and technical instruction.`}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {coach.specialization.slice(0, 3).map((spec, idx) => (
                                            <span key={idx} className="bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-wider">
                                                {spec.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Pricing Bar */}
                                <div className="px-8 pb-8 pt-2 mt-auto">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50/80 rounded-[2rem] border border-slate-100 mb-6">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Hourly</p>
                                            <p className="text-base font-black text-indigo-600 whitespace-nowrap">Rs.{coach.hourlyRate}</p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-200" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Monthly</p>
                                            <p className="text-base font-black text-emerald-600 whitespace-nowrap">
                                                {coach.monthlyFee ? `Rs.${coach.monthlyFee}` : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <Link to={`/coaches/${coach._id}`} className="block">
                                        <Button
                                            fullWidth
                                            className="h-14 shadow-lg shadow-indigo-100 rounded-2xl font-bold bg-slate-900 group-hover:bg-indigo-600 text-white transition-all duration-300 flex items-center justify-center gap-2"
                                        >
                                            View Professional <ArrowRightIcon className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div key="empty">
                        <EmptyState
                            icon={AcademicCapIcon}
                            title="No Coaches Found"
                            description="Try adjusting your filters to find available mentors."
                            actionLabel="Clear Filters"
                            action={() => {
                                const resetFilters = { city: '', skillLevel: '', court: '', minRate: '', maxRate: '', paymentType: 'hourly' };
                                setFilters(resetFilters);
                                fetchCoaches(resetFilters);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CoachList;
