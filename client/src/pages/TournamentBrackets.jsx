import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import tournamentService from '../services/tournamentService';
import TournamentBracket from '../components/tournament/TournamentBracket';
import Button from '../components/ui/Button';
import { getBadmintonGameWinner } from '../utils/badmintonScoring';
import {
    ArrowLeftIcon,
    TrophyIcon,
    ChartBarIcon,
    ListBulletIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline';

const CATEGORY_LABELS = {
    mens_singles: "Men's Singles",
    womens_singles: "Women's Singles",
    mens_doubles: "Men's Doubles",
    womens_doubles: "Women's Doubles",
    mixed_doubles: 'Mixed Doubles',
    junior_boys: 'Junior Boys',
    junior_girls: 'Junior Girls'
};

const getCategoryLabel = (category) => CATEGORY_LABELS[category] || category;

const ROUND_LABELS = {
    round_of_64: 'Round of 64',
    round_of_32: 'Round of 32',
    round_of_16: 'Round of 16',
    quarter_final: 'Quarter-final',
    semi_final: 'Semi-final',
    final: 'Final'
};

const TABS = [
    { id: 'draws', label: 'Draws', icon: Squares2X2Icon },
    { id: 'matches', label: 'Matches', icon: ListBulletIcon },
    { id: 'leaderboard', label: 'Leaderboard', icon: ChartBarIcon }
];

const TournamentBrackets = () => {
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();
    const { success, error: toastError } = useToast();

    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [activeTab, setActiveTab] = useState('draws');
    const [loading, setLoading] = useState(true);

    const [resultModal, setResultModal] = useState({
        open: false,
        matchId: '',
        participant1Score: [0, 0, 0],
        participant2Score: [0, 0, 0]
    });

    useEffect(() => {
        fetchTournament();
    }, [id]);

    useEffect(() => {
        if (selectedCategory) {
            fetchMatches();
            fetchLeaderboard();
        }
    }, [selectedCategory]);

    const fetchTournament = async () => {
        try {
            setLoading(true);
            const data = await tournamentService.getTournament(id);
            setTournament(data.data);
            if (data.data.categories?.length > 0) {
                setSelectedCategory(data.data.categories[0].name);
            }
        } catch (err) {
            console.error('Error fetching tournament:', err);
            toastError('Could not load tournament.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMatches = async () => {
        try {
            const data = await tournamentService.getTournamentMatches(id, { category: selectedCategory });
            setMatches(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            console.error('Error fetching matches:', err);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const data = await tournamentService.getLeaderboard(id, selectedCategory);
            setLeaderboard(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        }
    };

    const openResultModal = (match) => {
        setResultModal({
            open: true,
            matchId: match._id,
            participant1Score: match.participant1.score || [0, 0, 0],
            participant2Score: match.participant2.score || [0, 0, 0]
        });
    };

    const closeResultModal = () => {
        setResultModal({
            open: false,
            matchId: '',
            participant1Score: [0, 0, 0],
            participant2Score: [0, 0, 0]
        });
    };

    const handleScoreChange = (player, setIndex, value) => {
        const score = parseInt(value, 10) || 0;
        if (player === 1) {
            const newScores = [...resultModal.participant1Score];
            newScores[setIndex] = score;
            setResultModal({ ...resultModal, participant1Score: newScores });
        } else {
            const newScores = [...resultModal.participant2Score];
            newScores[setIndex] = score;
            setResultModal({ ...resultModal, participant2Score: newScores });
        }
    };

    const submitMatchResult = async () => {
        try {
            await tournamentService.submitMatchResult(resultModal.matchId, {
                participant1Score: resultModal.participant1Score,
                participant2Score: resultModal.participant2Score
            });
            closeResultModal();
            fetchMatches();
            fetchLeaderboard();
            success('Match result saved.');
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to submit result.');
        }
    };

    const convertMatchesToDrawFormat = () => {
        const roundOrder = ['round_of_64', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'];
        const rounds = {};

        matches.forEach((match) => {
            if (!rounds[match.round]) {
                rounds[match.round] = {
                    title: ROUND_LABELS[match.round] || match.round.replace(/_/g, ' '),
                    matches: []
                };
            }

            const p1Reg = match.participant1.registration;
            const p2Reg = match.participant2.registration;

            rounds[match.round].matches.push({
                id: match._id,
                player1: {
                    name: p1Reg ? p1Reg.player?.name || p1Reg.teamName || 'TBD' : 'TBD',
                    scores: match.participant1.score || [],
                    isWinner: match.participant1.isWinner
                },
                player2: {
                    name: p2Reg ? p2Reg.player?.name || p2Reg.teamName || 'TBD' : 'TBD',
                    scores: match.participant2.score || [],
                    isWinner: match.participant2.isWinner
                },
                status: match.status,
                rawMatch: match
            });
        });

        return roundOrder.filter((round) => rounds[round]).map((round) => rounds[round]);
    };

    const isOrganizer = isAuthenticated && user?.role === 'organizer';
    const canSubmitResults = isOrganizer || user?.role === 'admin';
    const getRegistrationName = (registration, fallback = 'TBD') =>
        registration ? registration.player?.name || registration.teamName || fallback : fallback;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <div className="h-12 w-12 border-4 border-amber-200 border-t-indigo-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="py-20 text-center">
                <p className="font-bold text-slate-700">Tournament not found</p>
                <Link to="/tournaments" className="text-indigo-800 font-bold text-sm mt-4 inline-block hover:underline">
                    Browse tournaments
                </Link>
            </div>
        );
    }

    const drawData = convertMatchesToDrawFormat();
    const activeMatch = matches.find((m) => m._id === resultModal.matchId);

    return (
        <div className="pb-24">
            {/* Header */}
            <header className="mb-6">
                <Link
                    to={`/tournaments/${id}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-indigo-900/70 hover:text-indigo-950 mb-4"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Tournament details
                </Link>
                <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-indigo-950 to-indigo-900 px-5 sm:px-8 py-6 sm:py-7 text-white shadow-md">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center shrink-0">
                            <TrophyIcon className="h-6 w-6 text-amber-300" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight truncate">
                                {tournament.name}
                            </h1>
                            <p className="text-sm text-indigo-200/90 font-medium mt-1">Draws & results</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Controls */}
            <div className="rounded-2xl border border-amber-100 bg-white shadow-sm p-4 sm:p-5 mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-amber-800/70 mb-1.5 block">
                            Category
                        </label>
                        <select
                            className="w-full sm:max-w-xs h-11 px-4 rounded-xl border border-amber-100 bg-slate-50 font-bold text-sm text-slate-900 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {tournament.categories.map((cat) => (
                                <option key={cat.name} value={cat.name}>
                                    {getCategoryLabel(cat.name)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <nav className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                    {TABS.map((tab) => {
                        const TabIcon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={twMerge(
                                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-colors',
                                    activeTab === tab.id
                                        ? 'bg-white text-indigo-950 shadow-sm border border-amber-100'
                                        : 'text-slate-500 hover:text-slate-800'
                                )}
                            >
                                <TabIcon className="h-4 w-4 shrink-0" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {activeTab === 'draws' && (
                    <div className="p-4 sm:p-6">
                        {drawData.length > 0 ? (
                            <TournamentBracket
                                rounds={drawData}
                                onMatchClick={openResultModal}
                                isEditable={canSubmitResults}
                            />
                        ) : (
                            <EmptyPanel message="No draws yet for this category." />
                        )}
                    </div>
                )}

                {activeTab === 'matches' && (
                    <div className="p-4 sm:p-6 space-y-4">
                        {matches.length > 0 ? (
                            matches.map((match) => {
                                const p1 = match.participant1.registration;
                                const p2 = match.participant2.registration;
                                const p1Name = getRegistrationName(p1);
                                const p2Name = getRegistrationName(p2);
                                const roundLabel =
                                    ROUND_LABELS[match.round] || match.round?.replace(/_/g, ' ');
                                const winnerName = match.participant1.isWinner
                                    ? p1Name
                                    : match.participant2.isWinner
                                        ? p2Name
                                        : '';

                                return (
                                    <div
                                        key={match._id}
                                        className="rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-amber-200 transition-colors"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                {roundLabel} · Match {match.matchNumber}
                                            </span>
                                            <StatusPill status={match.status} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                                            <PlayerLine
                                                name={p1Name}
                                                scores={match.participant1.score}
                                                opponentScores={match.participant2.score}
                                                participant="participant1"
                                                winner={match.participant1.isWinner}
                                            />
                                            <span className="text-center text-xs font-black text-slate-300">VS</span>
                                            <PlayerLine
                                                name={p2Name}
                                                scores={match.participant2.score}
                                                opponentScores={match.participant1.score}
                                                participant="participant2"
                                                winner={match.participant2.isWinner}
                                            />
                                        </div>

                                        {winnerName && (
                                            <div className="mt-4 inline-flex rounded-full bg-indigo-950 px-3 py-1 text-xs font-bold text-amber-100">
                                                Overall winner: {winnerName}
                                            </div>
                                        )}

                                        {canSubmitResults && match.status !== 'completed' && p1 && p2 && (
                                            <div className="mt-4 flex justify-end">
                                                <Button
                                                    onClick={() => openResultModal(match)}
                                                    className="h-10 px-5 rounded-xl text-sm font-bold bg-indigo-950 text-amber-50 hover:bg-indigo-900"
                                                >
                                                    Enter scores
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <EmptyPanel message="No matches scheduled." />
                        )}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="overflow-x-auto">
                        {leaderboard.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-5 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                                            #
                                        </th>
                                        <th className="px-5 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                                            Player
                                        </th>
                                        <th className="px-5 py-3 text-center font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                                            W
                                        </th>
                                        <th className="px-5 py-3 text-center font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                                            L
                                        </th>
                                        <th className="px-5 py-3 text-center font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                                            Games
                                        </th>
                                        <th className="px-5 py-3 text-center font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                                            Pts
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leaderboard.map((entry) => (
                                        <tr key={entry.rank} className="hover:bg-amber-50/30">
                                            <td className="px-5 py-4 font-black text-indigo-950">{entry.rank}</td>
                                            <td className="px-5 py-4 font-bold text-slate-800">
                                                {entry.registration.player?.name || entry.registration.teamName}
                                            </td>
                                            <td className="px-5 py-4 text-center font-bold text-emerald-700">
                                                {entry.wins}
                                            </td>
                                            <td className="px-5 py-4 text-center font-bold text-rose-600">
                                                {entry.losses}
                                            </td>
                                            <td className="px-5 py-4 text-center text-slate-600">{entry.setsWon}</td>
                                            <td className="px-5 py-4 text-center font-black">{entry.pointsWon}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <EmptyPanel message="No leaderboard data yet." />
                        )}
                    </div>
                )}
            </div>

            {resultModal.open && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl border border-amber-100 p-6 sm:p-8 max-w-lg w-full shadow-xl">
                        <h3 className="text-xl font-black text-slate-900 mb-1">Match scores</h3>
                        <p className="text-sm text-slate-500 mb-6">Enter up to three games. A match is best of 3 games to 21.</p>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <ScoreColumn
                                label={
                                    activeMatch?.participant1?.registration?.player?.name || 'Player 1'
                                }
                                scores={resultModal.participant1Score}
                                onChange={(i, v) => handleScoreChange(1, i, v)}
                            />
                            <ScoreColumn
                                label={
                                    activeMatch?.participant2?.registration?.player?.name || 'Player 2'
                                }
                                scores={resultModal.participant2Score}
                                onChange={(i, v) => handleScoreChange(2, i, v)}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={closeResultModal} className="flex-1 h-11 rounded-xl font-bold">
                                Cancel
                            </Button>
                            <Button
                                onClick={submitMatchResult}
                                className="flex-[2] h-11 rounded-xl font-bold bg-indigo-950 text-amber-50"
                            >
                                Save result
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function EmptyPanel({ message }) {
    return (
        <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-sm font-medium text-slate-500">{message}</p>
        </div>
    );
}

function StatusPill({ status }) {
    const styles = {
        completed: 'bg-emerald-100 text-emerald-800',
        scheduled: 'bg-blue-100 text-blue-800',
        in_progress: 'bg-amber-100 text-amber-900'
    };
    return (
        <span
            className={twMerge(
                'px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase',
                styles[status] || 'bg-slate-100 text-slate-600'
            )}
        >
            {status?.replace(/_/g, ' ') || status}
        </span>
    );
}

function PlayerLine({ name, scores, opponentScores, participant, winner }) {
    return (
        <div
            className={twMerge(
                'rounded-lg border px-3 py-2.5 flex items-center justify-between gap-2',
                winner ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-slate-50/50'
            )}
        >
            <span className={twMerge('font-bold text-sm truncate', winner && 'text-indigo-950')}>
                {name || 'TBD'}
            </span>
            <div className="flex gap-1 shrink-0">
                {scores?.length
                    ? scores.map((s, i) => {
                          const gameWinner = getBadmintonGameWinner(
                              participant === 'participant1' ? s : opponentScores?.[i],
                              participant === 'participant2' ? s : opponentScores?.[i]
                          );
                          const wonGame = gameWinner === participant;

                          return (
                              <span
                                  key={i}
                                  title={wonGame ? `Won game ${i + 1}` : `Lost game ${i + 1}`}
                                  className={twMerge(
                                      'w-7 h-7 flex items-center justify-center rounded text-xs font-bold',
                                      wonGame ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600',
                                      winner && !wonGame ? 'ring-1 ring-indigo-200' : ''
                                  )}
                              >
                                  {s}
                              </span>
                          );
                      })
                    : null}
            </div>
        </div>
    );
}

function ScoreColumn({ label, scores, onChange }) {
    return (
        <div>
            <p className="text-sm font-bold text-slate-800 truncate mb-3">{label}</p>
            <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                    <input
                        key={i}
                        type="number"
                        min="0"
                        max="30"
                        placeholder={`Game ${i + 1}`}
                        className="w-full text-center font-bold py-2.5 rounded-lg border border-slate-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none"
                        value={scores[i]}
                        onChange={(e) => onChange(i, e.target.value)}
                    />
                ))}
            </div>
        </div>
    );
}

export default TournamentBrackets;
