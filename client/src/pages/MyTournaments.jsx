import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    CalendarDaysIcon,
    MapPinIcon,
    PlusIcon,
    TrophyIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import tournamentService from '../services/tournamentService';

const statusBadgeClass = (status) => {
    const badges = {
        draft: 'bg-slate-100 text-slate-600 border-slate-200',
        registration_open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        registration_closed: 'bg-amber-50 text-amber-700 border-amber-100',
        in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        completed: 'bg-violet-50 text-violet-700 border-violet-100',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-100'
    };
    return badges[status] || badges.draft;
};

const categoryLabel = (category) => {
    const labels = {
        mens_singles: "Men's Singles",
        womens_singles: "Women's Singles",
        mens_doubles: "Men's Doubles",
        womens_doubles: "Women's Doubles",
        mixed_doubles: "Mixed Doubles",
        junior_boys: "Junior Boys",
        junior_girls: "Junior Girls"
    };
    return labels[category] || category;
};

const MyTournaments = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingBrackets, setGeneratingBrackets] = useState(false);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const data = await tournamentService.getMyTournaments();
            setTournaments(data.data);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    const handlePublish = async (id) => {
        if (!window.confirm('Are you sure you want to publish this tournament? It will be visible to all players.')) return;
        try {
            await tournamentService.publishTournament(id);
            fetchTournaments();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to publish tournament');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) return;
        try {
            await tournamentService.deleteTournament(id);
            fetchTournaments();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete tournament');
        }
    };

    const handleGenerateBrackets = async (tournamentId, category) => {
        if (!window.confirm(`Generate brackets for ${categoryLabel(category)}? This cannot be undone.`)) return;
        try {
            setGeneratingBrackets(true);
            await tournamentService.generateBrackets(tournamentId, category);
            alert('Brackets generated successfully!');
            navigate(`/tournaments/${tournamentId}/brackets`);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to generate brackets');
        } finally {
            setGeneratingBrackets(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" aria-label="Loading tournaments" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-amber-500 p-6 sm:p-8 text-white shadow-lg">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-100">Tournament management</p>
                        <h1 className="mt-2 text-3xl font-extrabold">My Tournaments</h1>
                        <p className="mt-2 max-w-xl text-sm text-white/90">Publish events, track registrations, and prepare brackets for each division.</p>
                    </div>
                    <Link
                        to="/app/tournaments/create"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-indigo-700 shadow-lg shadow-indigo-900/10 transition-all hover:bg-indigo-50"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Create Tournament
                    </Link>
                </div>
            </header>

            {tournaments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-amber-200 bg-gradient-to-br from-white to-amber-50/60 py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-950 text-amber-200 shadow-lg">
                        <TrophyIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No tournaments yet</h3>
                    <p className="mb-6 mt-2 text-slate-500">Create your first event and invite players to register.</p>
                    <Link to="/app/tournaments/create" className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700">
                        Create Tournament
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {tournaments.map((tournament) => (
                        <article key={tournament._id} className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-[0_16px_48px_-24px_rgba(30,27,75,0.18)]">
                            <div className="border-b border-amber-100 bg-gradient-to-r from-indigo-950 to-indigo-900 p-5 text-white sm:p-6">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Championship</p>
                                        <h2 className="mt-2 text-2xl font-extrabold">{tournament.name}</h2>
                                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-indigo-100/85">{tournament.description}</p>
                                    </div>
                                    <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(tournament.status)}`}>
                                        {tournament.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6 p-5 sm:p-6">
                                <div className="grid gap-3 text-sm sm:grid-cols-3">
                                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-slate-600">
                                        <MapPinIcon className="h-5 w-5 text-amber-600" />
                                        <span className="font-semibold">{tournament.venue}, {tournament.city}</span>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-slate-600">
                                        <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
                                        <span className="font-semibold">{new Date(tournament.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-slate-600">
                                        <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                                        <span className="font-semibold">{tournament.categories.length} divisions</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900">Divisions & Brackets</h3>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {tournament.categories.map((cat) => (
                                            <div key={cat.name} className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-gradient-to-r from-slate-50 to-amber-50/50 p-3">
                                                <div>
                                                    <p className="font-bold text-slate-900">{categoryLabel(cat.name)}</p>
                                                    <p className="text-xs text-slate-500">{tournament.registrationCounts?.[cat.name] || 0} / {cat.maxParticipants} registered</p>
                                                </div>
                                                {tournament.status === 'registration_closed' || tournament.status === 'in_progress' ? (
                                                    <button
                                                        onClick={() => handleGenerateBrackets(tournament._id, cat.name)}
                                                        disabled={generatingBrackets}
                                                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300"
                                                    >
                                                        Generate
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-semibold text-slate-400">Awaiting close</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 border-t border-amber-100 pt-5">
                                    <Link to={`/tournaments/${tournament._id}`} className="rounded-xl bg-indigo-950 px-4 py-2.5 text-sm font-bold text-amber-50 hover:bg-indigo-900">View Details</Link>
                                    <Link to={`/tournaments/${tournament._id}/brackets`} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">View Brackets</Link>
                                    {tournament.status === 'draft' && (
                                        <>
                                            <button onClick={() => handlePublish(tournament._id)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">Publish</button>
                                            <Link to={`/tournaments/${tournament._id}/edit`} className="rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-amber-50">Edit</Link>
                                        </>
                                    )}
                                    {(tournament.status === 'draft' || tournament.status === 'cancelled') && (
                                        <button onClick={() => handleDelete(tournament._id)} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 sm:ml-auto">Delete</button>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTournaments;
