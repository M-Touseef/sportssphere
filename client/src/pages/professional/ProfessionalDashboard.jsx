import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyRegistrations } from '../../services/tournamentService';
import courtService from '../../services/courtService';
import {
    TrophyIcon,
    CalendarIcon,
    AcademicCapIcon,
    ClockIcon,
    ChevronRightIcon,
    MapPinIcon,
    InboxIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import * as professionalService from '../../services/professionalService';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';

import StatTile from '../../components/ui/StatTile';
import RequestCard from '../../components/professional/RequestCard';

const ProfessionalDashboard = () => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();
    const [registrations, setRegistrations] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const isVerifiedPro = user?.verified && (user?.skillLevel === 'professional' || user?.role === 'coach');

                const promises = [
                    getMyRegistrations().catch(() => ({ data: [] })),
                    courtService.getMyBookings().catch(() => ({ data: [] }))
                ];

                // Only fetch requests if user is a verified professional
                if (isVerifiedPro) {
                    promises.push(professionalService.getIncomingRequests().catch(() => ({ data: [] })));
                }

                const results = await Promise.all(promises);

                const regRes = results[0];
                const bookingRes = results[1];
                const requestRes = isVerifiedPro ? results[2] : { data: [] };

                if (regRes && regRes.success) {
                    setRegistrations(regRes.data);
                }
                if (bookingRes && bookingRes.success) {
                    setBookings(bookingRes.data);
                }
                if (requestRes && (requestRes.success || Array.isArray(requestRes.data))) {
                    setRequests(requestRes.data || []);
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const handleStatusChange = (id, newStatus) => {
        setRequests(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    };

    if (loading) return <LoadingSpinner />;

    const upcomingTournaments = registrations.filter(r =>
        ['registration_open', 'registration_closed', 'in_progress'].includes(r.tournament?.status)
    );

    const upcomingBookings = bookings.filter(b =>
        new Date(b.date) >= new Date().setHours(0, 0, 0, 0)
    ).slice(0, 3);

    const pendingRequests = requests.filter(r => r.status === 'PENDING_RESPONSE');

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
  {/* Header */}
  <header className="bg-gradient-to-r from-indigo-600 to-amber-500 p-6 rounded-2xl shadow-md text-white">
    <h1 className="text-3xl font-extrabold">Professional Dashboard</h1>
    <p className="mt-1 text-sm opacity-90">Manage your competitive career and training schedule.</p>
  </header>
  
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Professional Dashboard</h1>
                    <p className="mt-2 text-slate-500 font-medium">Manage your competitive career and training schedule.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/tournaments" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                        Browse Tournaments
                    </Link>
                    <Link to="/coaches" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
                        Book a Coach
                    </Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <CalendarIcon className="h-10 w-10 text-indigo-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Sparring Availability</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">Open slots for sparring and let players find you at your preferred courts.</p>
                        <button
                            onClick={() => navigate('/pro/availability')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/50"
                        >
                            Manage Schedule
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-48 w-48 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all" />
                </div>

                <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-all">
                    <div className="relative z-10">
                        <TrophyIcon className="h-10 w-10 text-amber-500 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Find Tournaments</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">Browse upcoming championships and register to start your journey.</p>
                        <Link
                            to="/tournaments"
                            className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-slate-200/50"
                        >
                            Browse Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  label="Active Tournaments"
                  value={upcomingTournaments.length}
                  icon={TrophyIcon}
                />
                <StatTile
                  label="Upcoming Bookings"
                  value={upcomingBookings.length}
                  icon={CalendarIcon}
                />
                <StatTile
                  label="Action Items"
                  value={pendingRequests.length}
                  icon={InboxIcon}
                />
                <StatTile
                  label="Skill Level"
                  value="PRO"
                  icon={AcademicCapIcon}
                />
            </div>

            {/* Matching Requests Section */}
            {pendingRequests.length > 0 && (
                <section className="bg-slate-50/50 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                <InboxIcon className="h-6 w-6 text-indigo-600" />
                                Action Items
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Pending requests requiring your attention.</p>
                        </div>
                        <Link to="/pro/requests" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                            View All
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pendingRequests.slice(0, 2).map((req) => (
                            <RequestCard
                                key={req._id}
                                request={req}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Registered Tournaments Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Your Tournaments</h2>
                        <Link to="/my-tournaments" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            See all <ChevronRightIcon className="h-4 w-4" />
                        </Link>
                    </div>
                    {registrations.length > 0 ? (
                        <div className="space-y-4">
                            {registrations.slice(0, 3).map(reg => (
                                <div key={reg._id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-slate-900">{reg.tournament?.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {reg.category?.replace('_', ' ').toUpperCase()} • {new Date(reg.tournament?.startDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${reg.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {reg.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <TrophyIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500">Not registered in any tournaments yet.</p>
                            <Link to="/tournaments" className="text-sm text-indigo-600 font-medium mt-2 inline-block">Find a tournament</Link>
                        </div>
                    )}
                </div>

                {/* Upcoming Schedule */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Upcoming Schedule</h2>
                        <Link to="/bookings" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            Calendar <ChevronRightIcon className="h-4 w-4" />
                        </Link>
                    </div>
                    {upcomingBookings.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingBookings.map(booking => (
                                <div key={booking._id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                                        <MapPinIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{booking.court?.name || 'Court Booking'}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <ClockIcon className="h-3.5 w-3.5" />
                                            {booking.startTime} • {new Date(booking.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CalendarIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500">No upcoming bookings.</p>
                            <Link to="/courts" className="text-sm text-indigo-600 font-medium mt-2 inline-block">Book a court</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfessionalDashboard;
