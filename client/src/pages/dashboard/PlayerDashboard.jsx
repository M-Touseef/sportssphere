import React, { useState, useEffect } from 'react';
import {
    CalendarIcon,
    UserGroupIcon,
    TrophyIcon,
    PlusIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    ArrowRightIcon,
    MapPinIcon,
    SparklesIcon,
    ChevronRightIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

import courtService from '../../services/courtService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/ui/StatCard';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { motion } from 'framer-motion';

export default function PlayerDashboard() {
    const { user } = useAuth();
    const { error } = useToast();
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setFetchError(false);
            const data = await courtService.getMyBookings();
            setUpcomingBookings(data.data.map(b => ({
                id: b._id,
                court: b.court.name,
                date: new Date(b.date).toLocaleDateString(),
                time: b.startTime,
                status: b.status
            })));
        } catch (err) {
            setFetchError(true);
            error('Session synchronization failed. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const sparringRequests = [];
    const tournaments = [];

    return (
        <div className="space-y-12 pb-32">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-gradient-to-br from-slate-900 to-indigo-950 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <SparklesIcon className="h-64 w-64 rotate-12 translate-x-32 -translate-y-32" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="h-2 w-8 bg-indigo-500 rounded-full" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Player Command Center</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none">
                        Elite Performance, <br />
                        <span className="text-indigo-400">{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="mt-6 text-base sm:text-lg text-slate-300 font-medium max-w-xl leading-relaxed">
                        Your operational grid is active. {upcomingBookings.length > 0 ? "Upcoming sessions detected." : "Standing by for bookings."}
                    </p>
                </div>
                <div className="relative z-10 group">
                    <Link to="/courts">
                        <motion.button
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-3 bg-white text-slate-900 px-10 h-16 rounded-[2rem] font-black shadow-2xl shadow-white/10 hover:shadow-indigo-500/40 transition-all border-b-4 border-slate-200 active:border-b-0"
                        >
                            <PlusIcon className="h-6 w-6 text-indigo-600" />
                            Book Court
                        </motion.button>
                    </Link>
                </div>
            </div>

            {/* Tactical Metrics Dashboard */}
            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] border border-slate-100 relative group transition-all duration-500">
                    <div className="flex items-start justify-between mb-8">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                            <CalendarIcon className="h-7 w-7" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Upcoming Sessions</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{loading ? "..." : upcomingBookings.length}</h3>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                </div>

                <Link to="/sparring/requests" className="contents">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.15)] relative group cursor-pointer border border-slate-800 transition-all duration-500 hover:-translate-y-2">
                        <div className="flex items-start justify-between mb-8 text-white">
                            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
                                <UserGroupIcon className="h-7 w-7" />
                            </div>
                            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/50 group-hover:scale-110 transition-transform">
                                <ArrowRightIcon className="h-4 w-4" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Sparring Invites</p>
                            <div className="flex items-baseline gap-2 text-white">
                                <h3 className="text-4xl font-black tracking-tighter">{sparringRequests.length}</h3>
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest italic font-serif">New Matrix</span>
                            </div>
                        </div>
                    </div>
                </Link>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] border border-slate-100 relative group transition-all duration-500">
                    <div className="flex items-start justify-between mb-8">
                        <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100/50">
                            <TrophyIcon className="h-7 w-7" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tournament Rank</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{tournaments.length}</h3>
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">Global Circuit</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-start">
                {/* Bookings Modular List */}
                <div className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden flex flex-col min-h-[400px] sm:min-h-[500px]">
                    <div className="px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <ClockIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">Your Schedule</h2>
                        </div>
                        <Link to="/bookings" className="text-[9px] sm:text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest group flex items-center gap-2">
                            View All <ChevronRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="flex-1 p-5 sm:p-8">
                        {loading ? (
                            <TableSkeleton rows={4} />
                        ) : fetchError ? (
                            <div className="h-full flex flex-col items-center justify-center p-10 text-center gap-6">
                                <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-300">
                                    <ExclamationTriangleIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-700">Grid Sync Failure</p>
                                    <p className="text-slate-400 text-sm mt-1">Unable to stabilize booking data stream.</p>
                                </div>
                                <Button onClick={fetchBookings} variant="outline" className="px-8 h-11 font-bold border-slate-200">Re-initialize</Button>
                            </div>
                        ) : upcomingBookings.length > 0 ? (
                            <ul role="list" className="space-y-6">
                                {upcomingBookings.map((booking) => (
                                    <motion.li
                                        key={booking.id}
                                        whileHover={{ x: 8 }}
                                        className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-slate-50/50 hover:bg-white rounded-[2rem] border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-300"
                                    >
                                        {/* Left Section: Icon + Court Info */}
                                        <div className="flex items-start sm:items-center gap-6 flex-1 min-w-0">
                                            <div className="h-16 w-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                                                <MapPinIcon className="h-8 w-8" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                                    <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight break-words">
                                                        {booking.court}
                                                    </h4>
                                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-600 border border-emerald-100 uppercase tracking-widest shadow-sm w-fit">
                                                        <CheckCircleIcon className="h-3.5 w-3.5" />
                                                        Confirmed
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                                        <ClockIcon className="h-4 w-4 text-indigo-500" />
                                                        <span className="text-slate-600">{booking.time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                                        <CalendarIcon className="h-4 w-4 text-slate-500" />
                                                        <span className="text-slate-600">{booking.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Section: Action Arrow */}
                                        <div className="shrink-0 hidden sm:flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                <ChevronRightIcon className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <div className="h-full py-12 flex items-center justify-center">
                                <EmptyState
                                    icon={CalendarIcon}
                                    title="No Upcoming Games"
                                    description="You haven't booked any courts yet."
                                    actionLabel="Book a Court"
                                    actionHref="/courts"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Tournament Records Terminal */}
                <div className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden flex flex-col min-h-[400px] sm:min-h-[500px]">
                    <div className="px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                <TrophyIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">Competitions</h2>
                        </div>
                        <Link to="/tournaments" className="text-[9px] sm:text-[10px] font-bold text-amber-600 hover:text-amber-800 uppercase tracking-widest group flex items-center gap-2">
                            View Brackets <ChevronRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="flex-1 p-10 flex items-center justify-center">
                        <EmptyState
                            icon={TrophyIcon}
                            title="No Competitions"
                            description="You haven't joined any tournaments yet."
                            actionLabel="Browse Tournaments"
                            actionHref="/tournaments"
                        />
                    </div>
                </div>
            </div>


        </div>
    );
}
