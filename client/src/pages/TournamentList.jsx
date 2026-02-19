import { useState, useEffect } from 'react';
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
    AdjustmentsHorizontalIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

const TournamentList = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const { error } = useToast();
    const [filters, setFilters] = useState({
        city: '',
        status: '',
        upcoming: 'true'
    });

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            setFetchError(false);
            const data = await tournamentService.getTournaments(filters);
            setTournaments(data.data);
        } catch (err) {
            console.error('Error fetching tournaments:', err);
            setFetchError(true);
            error('Failed to load tournaments. Please check your connection.');
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
        fetchTournaments();
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: 'bg-slate-100 text-slate-600 border-slate-200',
            registration_open: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            registration_closed: 'bg-amber-50 text-amber-600 border-amber-100',
            in_progress: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            completed: 'bg-slate-100 text-slate-500 border-slate-200',
            cancelled: 'bg-rose-50 text-rose-600 border-rose-100'
        };
        return badges[status] || 'bg-slate-100 text-slate-500 border-slate-200';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 mb-10 sm:mb-16">
                <div className="max-w-3xl">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">Tournaments</h1>
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-slate-500 font-medium leading-relaxed">
                        Discover and join badminton competitions in your area. Showcase your skills in regional events.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl font-bold bg-white shadow-sm border-slate-200">
                        <AdjustmentsHorizontalIcon className="h-5 w-5" />
                        Sort By
                    </Button>
                </div>
            </div>

            {/* Premium Filter System */}
            <div className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 mb-10 sm:mb-16">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-end">
                    <div className="md:col-span-5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block ml-1">City</label>
                        <div className="relative">
                            <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 pointer-events-none" />
                            <input
                                type="text"
                                name="city"
                                placeholder="Search by city..."
                                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-slate-50/30 font-semibold text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
                                value={filters.city}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block ml-1">Status</label>
                        <select
                            name="status"
                            className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50/30 font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 outline-none transition-all shadow-sm"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Statuses</option>
                            <option value="registration_open">Registration Open</option>
                            <option value="registration_closed">Registration Closed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="md:col-span-3">
                        <Button type="submit" fullWidth size="lg" className="h-14 shadow-xl shadow-indigo-100 rounded-2xl font-bold text-base bg-slate-900 hover:bg-slate-800 text-white">
                            Search Tournaments
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
                        <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Error Loading Tournaments</h3>
                        <p className="text-slate-500 max-w-sm font-medium mb-10">We couldn't connect to the tournament list. Please check your internet and try again.</p>
                        <Button onClick={fetchTournaments} className="px-12 h-14 shadow-lg shadow-rose-100 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl">
                            Retry
                        </Button>
                    </motion.div>
                ) : tournaments.length > 0 ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                    >
                        {tournaments.map((tournament) => (
                            <motion.div
                                key={tournament._id}
                                layout
                                whileHover={{ y: -8 }}
                                className="group bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden transition-all duration-500 flex flex-col"
                            >
                                <div className="relative h-56 w-full overflow-hidden">
                                    {tournament.banner ? (
                                        <img
                                            src={tournament.banner}
                                            alt={tournament.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                            <TrophyIcon className="h-20 w-20 text-slate-200" />
                                        </div>
                                    )}
                                    <div className="absolute top-6 right-6">
                                        <span className={twMerge(
                                            "px-4 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-sm uppercase tracking-wider",
                                            getStatusBadge(tournament.status)
                                        )}>
                                            {tournament.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 sm:p-8 flex-1 flex flex-col">
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight group-hover:text-indigo-600 transition-colors">{tournament.name}</h3>

                                    <div className="space-y-4 mb-10">
                                        <div className="flex items-center gap-4 text-sm font-medium text-slate-500 bg-slate-50 p-3 rounded-2xl">
                                            <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                                                <MapPinIcon className="h-4 w-4" />
                                            </div>
                                            <span className="">{tournament.venue}, {tournament.city}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-medium text-slate-500 bg-slate-50 p-3 rounded-2xl">
                                            <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                                                <CalendarIcon className="h-4 w-4" />
                                            </div>
                                            <span>Starts {formatDate(tournament.startDate)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-lg shadow-slate-200 text-xs">
                                                {tournament.organizer?.name?.[0] || 'O'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Organizer</span>
                                                <span className="text-sm font-bold text-slate-800">{tournament.organizer?.name || 'Unknown'}</span>
                                            </div>
                                        </div>
                                        <Link to={`/tournaments/${tournament._id}`}>
                                            <Button className="px-6 rounded-xl h-11 text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white shadow-sm transition-all">
                                                Details
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
                            icon={TrophyIcon}
                            title="No Tournaments Found"
                            description="We couldn't find any tournaments matching your current filters."
                            actionLabel="Reset Filters"
                            action={() => {
                                setFilters({ city: '', status: '', upcoming: '' });
                                fetchTournaments();
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TournamentList;
