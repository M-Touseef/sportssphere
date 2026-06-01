import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrophyIcon, UsersIcon, CheckBadgeIcon, MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import StatTile from '../../components/ui/StatTile';
import tournamentService from '../../services/tournamentService';

function registrationTotal(tournament) {
    const counts = tournament.registrationCounts || {};
    return Object.values(counts).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
}

function statusBadgeClass(status) {
    const map = {
        draft: 'bg-slate-100 text-slate-600 border-slate-200',
        registration_open: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        registration_closed: 'bg-amber-50 text-amber-600 border-amber-100',
        in_progress: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        completed: 'bg-purple-50 text-purple-700 border-purple-100',
        cancelled: 'bg-rose-50 text-rose-600 border-rose-100'
    };
    return map[status] || 'bg-slate-100 text-slate-500 border-slate-200';
}

export default function OrganizerDashboard() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await tournamentService.getMyTournaments();
                if (!cancelled && res?.data) setTournaments(res.data);
            } catch (e) {
                console.error('Error loading organizer tournaments:', e);
                if (!cancelled) setTournaments([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const totalParticipants = tournaments.reduce((sum, t) => sum + registrationTotal(t), 0);
    const completedCount = tournaments.filter((t) => t.status === 'completed').length;

    return (
        <div className="space-y-8 animate-enter max-w-7xl mx-auto pb-20">
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-amber-500 p-6 sm:p-8 text-white shadow-lg">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-100">Court owner workspace</p>
                    <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight leading-none">
                        Organizer Dashboard
                    </h1>
                    <p className="mt-3 text-sm sm:text-base text-white/90 font-medium max-w-2xl leading-relaxed">
                        Manage your venues, tournaments, and player registrations from one place.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link
                        to="/org/courts/create"
                        className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-900/10 transition-all hover:bg-indigo-50"
                    >
                        <MapPinIcon className="h-5 w-5" aria-hidden="true" />
                        Add Court
                    </Link>
                    <Link
                        to="/app/tournaments/create"
                        className="inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-950 px-5 text-sm font-bold text-amber-50 shadow-lg shadow-indigo-950/20 transition-all hover:bg-indigo-900"
                    >
                        <PlusIcon className="h-5 w-5" aria-hidden="true" />
                        Create Tournament
                    </Link>
                </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <StatTile
                    label="Total Tournaments"
                    value={loading ? '…' : String(tournaments.length)}
                    icon={TrophyIcon}
                />
                <StatTile
                    label="Total Registrations"
                    value={loading ? '…' : String(totalParticipants)}
                    icon={UsersIcon}
                />
                <StatTile
                    label="Completed Events"
                    value={loading ? '…' : String(completedCount)}
                    icon={CheckBadgeIcon}
                />
            </div>

            <div className="flex flex-col space-y-4">
                <div className="bg-white shadow-[0_16px_48px_-24px_rgba(30,27,75,0.18)] border border-amber-100 rounded-3xl overflow-hidden flex flex-col">
                    <div className="px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <TrophyIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">Your tournaments</h2>
                        </div>
                        <Link
                            to="/app/tournaments"
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                            View all
                        </Link>
                    </div>
                    <div className="p-4 sm:p-8">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" aria-label="Loading" />
                            </div>
                        ) : tournaments.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <p className="text-slate-600 font-medium mb-2">No tournaments yet</p>
                                <p className="text-sm text-slate-500 mb-6">Create a tournament to see it here.</p>
                                <Link
                                    to="/app/tournaments/create"
                                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700"
                                >
                                    Create tournament
                                </Link>
                            </div>
                        ) : (
                            <ul role="list" className="space-y-4">
                                {tournaments.map((t) => {
                                    const regs = registrationTotal(t);
                                    const start = t.startDate ? new Date(t.startDate).toLocaleDateString() : '—';
                                    const label = (t.status || 'draft').replace(/_/g, ' ');
                                    return (
                                        <li key={t._id}>
                                            <Link
                                                to={`/tournaments/${t._id}`}
                                                className="group relative flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 p-5 sm:p-6 bg-gradient-to-r from-slate-50 to-amber-50/40 hover:from-white hover:to-indigo-50/40 rounded-2xl border border-transparent hover:border-amber-100 hover:shadow-lg hover:shadow-indigo-950/5 transition-all duration-300"
                                            >
                                                <div className="flex min-w-0 gap-x-4 sm:gap-x-6">
                                                    <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                        <TrophyIcon className="h-5 w-5 sm:h-7 sm:w-7" />
                                                    </div>
                                                    <div className="min-w-0 flex-auto flex flex-col justify-center">
                                                        <p className="text-sm sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1 break-words">
                                                            {t.name}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                            Starts {start}
                                                            {t.city ? ` · ${t.city}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center justify-between sm:justify-end min-w-0">
                                                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 min-w-0">
                                                        <span
                                                            className={`inline-flex items-center rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest border shrink-0 ${statusBadgeClass(t.status)}`}
                                                        >
                                                            {label}
                                                        </span>
                                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase truncate">
                                                            {regs} registered
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-2xl">
                    <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                        <div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-amber-100">
                                <MapPinIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-extrabold">Your Venues</h2>
                        </div>
                        <p className="mt-4 text-slate-300 text-sm max-w-2xl leading-relaxed">
                            Open any listing to see how players view it, edit pricing and photos, or add another court.
                        </p>
                        </div>
                        <div className="flex flex-wrap gap-3 sm:justify-end">
                            <Link
                                to="/org/courts"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500"
                            >
                                Open My Courts
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                            <Link
                                to="/org/courts/create"
                                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15"
                            >
                                Add court
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
