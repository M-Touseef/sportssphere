import React from 'react';
import { PlusIcon, TrophyIcon, UsersIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import StatCard from '../../components/ui/StatCard';
import { Link } from 'react-router-dom';

export default function OrganizerDashboard() {
    const tournaments = [
        { id: 1, name: 'Summer Slam', date: '2025-06-15', status: 'Registration Open', participants: 12 },
        { id: 2, name: 'City Championship', date: '2025-08-01', status: 'Draft', participants: 0 },
    ];

    return (
        <div className="space-y-12 animate-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
                        Organizer Dashboard
                    </h1>
                    <p className="mt-3 sm:mt-4 text-base sm:text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                        Manage your tournaments and participants.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link
                        to="/tournaments/create"
                        className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-slate-900 text-white px-8 h-14 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all"
                    >
                        <PlusIcon className="h-5 w-5" aria-hidden="true" />
                        Create Tournament
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-3">
                <StatCard
                    title="Total Tournaments"
                    value="4"
                    icon={TrophyIcon}
                    color="indigo"
                />
                <StatCard
                    title="Active Participants"
                    value="128"
                    icon={UsersIcon}
                    color="green"
                    trend={{ type: 'increase', value: '12%' }}
                />
                <StatCard
                    title="Completed"
                    value="2"
                    icon={CheckBadgeIcon}
                    color="blue"
                />
            </div>

            {/* Tournaments List */}
            <div className="flex flex-col space-y-4">
                <div className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden flex flex-col">
                    <div className="px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <TrophyIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">Your Tournaments</h2>
                        </div>
                    </div>
                    <div className="p-4 sm:p-8">
                        <ul role="list" className="space-y-4">
                            {tournaments.map((t) => (
                                <li key={t.id} className="group relative flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 p-5 sm:p-6 bg-slate-50/50 hover:bg-white rounded-2xl sm:rounded-[2rem] border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 cursor-pointer">
                                    <div className="flex min-w-0 gap-x-4 sm:gap-x-6">
                                        <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            <TrophyIcon className="h-5 w-5 sm:h-7 sm:w-7" />
                                        </div>
                                        <div className="min-w-0 flex-auto flex flex-col justify-center">
                                            <p className="text-sm sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1 break-words">
                                                {t.name}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                Deployment Date: {t.date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center justify-between sm:justify-end min-w-0">
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 min-w-0">
                                            <span className={`inline-flex items-center rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest border shrink-0 ${t.status === 'Registration Open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                {t.status}
                                            </span>
                                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase italic truncate">
                                                {t.participants} Units Registered
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
