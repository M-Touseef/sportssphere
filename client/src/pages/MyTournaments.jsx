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
import OrganizerPageHeader from '../components/organizer/OrganizerPageHeader';

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
        if (!window.confirm(`Generate draws for ${categoryLabel(category)}? This cannot be undone.`)) return;
        try {
            setGeneratingBrackets(true);
            await tournamentService.generateBrackets(tournamentId, category);
            alert('Draws generated successfully!');
            navigate(`/tournaments/${tournamentId}/brackets`);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to generate draws');
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
        <div className="mx-auto max-w-[1280px] space-y-6 pb-10">
            <OrganizerPageHeader
                eyebrow="Event portfolio"
                title="My tournaments"
                description="Publish events, monitor registration capacity, and prepare draws for every active division."
                icon={TrophyIcon}
                actions={<Link to="/app/tournaments/create" className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-lime-200"><PlusIcon className="h-5 w-5" /> Create tournament</Link>}
            >
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-sky-100">{tournaments.length} managed event{tournaments.length === 1 ? '' : 's'}</span>
            </OrganizerPageHeader>

            {tournaments.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/70 py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm ring-1 ring-slate-200">
                        <TrophyIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No tournaments yet</h3>
                    <p className="mb-6 mt-2 text-slate-500">Create your first event and invite players to register.</p>
                    <Link to="/app/tournaments/create" className="inline-flex rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-sky-900">
                        Create Tournament
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {tournaments.map((tournament) => (
                        <article key={tournament._id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                            <div className="border-b border-slate-800 bg-slate-950 p-5 text-white sm:p-7">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">Tournament operations</p>
                                        <h2 className="mt-2 text-2xl font-extrabold">{tournament.name}</h2>
                                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">{tournament.description}</p>
                                    </div>
                                    <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(tournament.status)}`}>
                                        {tournament.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6 p-5 sm:p-6">
                                <div className="grid gap-3 text-sm sm:grid-cols-3">
                                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-slate-600">
                                        <MapPinIcon className="h-5 w-5 text-sky-600" />
                                        <span className="font-semibold">{tournament.venue}, {tournament.city}</span>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-slate-600">
                                        <CalendarDaysIcon className="h-5 w-5 text-sky-600" />
                                        <span className="font-semibold">{new Date(tournament.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-slate-600">
                                        <UserGroupIcon className="h-5 w-5 text-sky-600" />
                                        <span className="font-semibold">{tournament.categories.length} divisions</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900">Divisions & Draws</h3>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {tournament.categories.map((cat) => (
                                            <div key={cat.name} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                                <div>
                                                    <p className="font-bold text-slate-900">{categoryLabel(cat.name)}</p>
                                                    <p className="text-xs text-slate-500">{tournament.registrationCounts?.[cat.name] || 0} / {cat.maxParticipants} registered</p>
                                                </div>
                                                {tournament.status === 'registration_closed' || tournament.status === 'in_progress' ? (
                                                    <button
                                                        onClick={() => handleGenerateBrackets(tournament._id, cat.name)}
                                                        disabled={generatingBrackets}
                                                        className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-sky-900 disabled:bg-slate-300"
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

                                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                                    <Link to={`/tournaments/${tournament._id}`} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-900">View details</Link>
                                    <Link to={`/tournaments/${tournament._id}/brackets`} className="rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-800 hover:bg-sky-100">View draws</Link>
                                    {tournament.status === 'draft' && (
                                        <>
                                            <button onClick={() => handlePublish(tournament._id)} className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-lime-200">Publish</button>
                                            <Link to={`/tournaments/${tournament._id}/edit`} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Edit</Link>
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
