import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tournamentService from '../services/tournamentService';
import TournamentBracket from '../components/tournament/TournamentBracket';

const TournamentBrackets = () => {
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();

    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [activeTab, setActiveTab] = useState('brackets');
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
            if (data.data.categories.length > 0) {
                setSelectedCategory(data.data.categories[0].name);
            }
        } catch (error) {
            console.error('Error fetching tournament:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMatches = async () => {
        try {
            const data = await tournamentService.getTournamentMatches(id, { category: selectedCategory });
            setMatches(data.data);
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const data = await tournamentService.getLeaderboard(id, selectedCategory);
            setLeaderboard(data.data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
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
        const score = parseInt(value) || 0;
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
            alert('Match result submitted successfully!');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to submit result');
        }
    };

    const convertMatchesToBracketFormat = () => {
        const roundOrder = ['round_of_64', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'];
        const rounds = {};

        matches.forEach(match => {
            if (!rounds[match.round]) {
                rounds[match.round] = {
                    title: match.round.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    matches: []
                };
            }

            const p1Reg = match.participant1.registration;
            const p2Reg = match.participant2.registration;

            rounds[match.round].matches.push({
                id: match._id,
                player1: {
                    name: p1Reg ? (p1Reg.player?.name || p1Reg.teamName || 'TBD') : 'TBD',
                    score: match.participant1.score?.reduce((a, b) => a + b, 0) || 0
                },
                player2: {
                    name: p2Reg ? (p2Reg.player?.name || p2Reg.teamName || 'TBD') : 'TBD',
                    score: match.participant2.score?.reduce((a, b) => a + b, 0) || 0
                },
                status: match.status,
                rawMatch: match
            });
        });

        return roundOrder
            .filter(round => rounds[round])
            .map(round => rounds[round]);
    };

    const getCategoryLabel = (category) => {
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

    const isOrganizer = isAuthenticated && user?.role === 'organizer';
    const canSubmitResults = isOrganizer || (user?.role === 'admin');

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!tournament) {
        return <div className="text-center py-12">Tournament not found</div>;
    }

    const bracketData = convertMatchesToBracketFormat();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="relative mb-8 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                </div>
                <Link to={`/tournaments/${id}`} className="text-indigo-200 hover:text-white transition-colors mb-4 inline-flex items-center gap-2 text-sm font-medium">
                    ← Back to Tournament Details
                </Link>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">{tournament.name}</h1>
                    <p className="text-indigo-200 text-lg font-medium">Championship Brackets & Live Results</p>
                </div>
            </div>

            {/* Category Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
                <select
                    className="w-full md:w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

            <div className="border-b border-gray-100 p-2">
                <nav className="flex space-x-2 p-1 bg-slate-100/50 rounded-xl">
                    {['brackets', 'matches', 'leaderboard'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === tab
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-6">
                {/* Brackets Tab */}
                {activeTab === 'brackets' && (
                    <div>
                        {bracketData.length > 0 ? (
                            <TournamentBracket
                                rounds={bracketData}
                                onMatchClick={openResultModal} // Pass the modal opener
                                isEditable={canSubmitResults} // Pass permission flag
                            />
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No brackets generated yet for this category</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Matches Tab */}
                {activeTab === 'matches' && (
                    <div className="space-y-4">
                        {matches.length > 0 ? (
                            matches.map((match) => {
                                const p1 = match.participant1.registration;
                                const p2 = match.participant2.registration;

                                return (
                                    <div key={match._id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest">
                                                    {match.round.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-sm font-medium text-slate-400">Match #{match.matchNumber}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${match.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                match.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {match.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                            {/* Player 1 */}
                                            <div className={`flex-1 w-full p-4 rounded-xl border ${match.participant1.isWinner ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className={`font-bold text-lg ${match.participant1.isWinner ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                        {p1 ? (p1.player?.name || p1.teamName) : 'TBD'}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        {match.participant1.score?.map((s, i) => (
                                                            <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold font-mono ${match.participant1.isWinner ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-slate-300 font-black text-xl italic">VS</div>

                                            {/* Player 2 */}
                                            <div className={`flex-1 w-full p-4 rounded-xl border ${match.participant2.isWinner ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className={`font-bold text-lg ${match.participant2.isWinner ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                        {p2 ? (p2.player?.name || p2.teamName) : 'TBD'}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        {match.participant2.score?.map((s, i) => (
                                                            <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold font-mono ${match.participant2.isWinner ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {canSubmitResults && match.status !== 'completed' && p1 && p2 && (
                                            <div className="mt-6 flex justify-end">
                                                <button
                                                    onClick={() => openResultModal(match)}
                                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all"
                                                >
                                                    Update Scorecard
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium text-lg">No matches scheduled.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Leaderboard Tab */}
                {activeTab === 'leaderboard' && (
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        {leaderboard.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Rank</th>
                                            <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Participant</th>
                                            <th className="px-8 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Wins</th>
                                            <th className="px-8 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Losses</th>
                                            <th className="px-8 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Sets</th>
                                            <th className="px-8 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {leaderboard.map((entry) => (
                                            <tr key={entry.rank} className={`hover:bg-slate-50/80 transition-colors duration-150 ${entry.rank === 1 ? 'bg-yellow-50/30' :
                                                entry.rank === 2 ? 'bg-slate-50/30' :
                                                    entry.rank === 3 ? 'bg-orange-50/30' : ''
                                                }`}>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-lg ${entry.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                                                        entry.rank === 2 ? 'bg-slate-200 text-slate-600' :
                                                            entry.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400 text-sm'
                                                        }`}>
                                                        #{entry.rank}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="font-bold text-slate-700 text-lg">
                                                        {entry.registration.player?.name || entry.registration.teamName}
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{entry.registration.player?.email}</div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-center">
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-bold">
                                                        {entry.wins}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-center">
                                                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold">
                                                        {entry.losses}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-center text-slate-600 font-mono font-medium">
                                                    {entry.setsWon}
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-center font-black text-slate-900">
                                                    {entry.pointsWon}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-slate-50">
                                <p className="text-slate-400 font-medium">No leaderboard data available yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Result Submission Modal */}
            {
                resultModal.open && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Match Scorecard</h3>
                                <p className="text-slate-500 font-medium">Enter the set scores below</p>
                            </div>

                            <div className="flex items-center justify-between mb-8 gap-4">
                                {/* P1 Column */}
                                <div className="flex-1 text-center">
                                    <div className="font-bold text-lg text-indigo-900 truncate mb-4">
                                        {matches.find(m => m._id === resultModal.matchId)?.participant1?.registration?.player?.name || 'Player 1'}
                                    </div>
                                    <div className="space-y-3">
                                        {[0, 1, 2].map(setIndex => (
                                            <input
                                                key={setIndex}
                                                type="number"
                                                min="0"
                                                max="30"
                                                placeholder={`Set ${setIndex + 1}`}
                                                className="w-full text-center text-xl font-bold font-mono py-3 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                value={resultModal.participant1Score[setIndex]}
                                                onChange={(e) => handleScoreChange(1, setIndex, e.target.value)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* VS Divider */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-16 w-px bg-slate-200"></div>
                                    <span className="text-slate-300 font-black italic text-xl">VS</span>
                                    <div className="h-16 w-px bg-slate-200"></div>
                                </div>

                                {/* P2 Column */}
                                <div className="flex-1 text-center">
                                    <div className="font-bold text-lg text-indigo-900 truncate mb-4">
                                        {matches.find(m => m._id === resultModal.matchId)?.participant2?.registration?.player?.name || 'Player 2'}
                                    </div>
                                    <div className="space-y-3">
                                        {[0, 1, 2].map(setIndex => (
                                            <input
                                                key={setIndex}
                                                type="number"
                                                min="0"
                                                max="30"
                                                placeholder={`Set ${setIndex + 1}`}
                                                className="w-full text-center text-xl font-bold font-mono py-3 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                value={resultModal.participant2Score[setIndex]}
                                                onChange={(e) => handleScoreChange(2, setIndex, e.target.value)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={closeResultModal}
                                    className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitMatchResult}
                                    className="flex-[2] py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all transform hover:scale-[1.02]"
                                >
                                    Confirm Result
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TournamentBrackets;
