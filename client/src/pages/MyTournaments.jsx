import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';

const MyTournaments = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [generatingBrackets, setGeneratingBrackets] = useState(false);

    useEffect(() => {
        fetchTournaments();
    }, []);

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
        if (!window.confirm(`Generate brackets for ${category}? This cannot be undone.`)) return;

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

    const getStatusBadge = (status) => {
        const badges = {
            draft: 'bg-gray-100 text-gray-800',
            registration_open: 'bg-green-100 text-green-800',
            registration_closed: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-purple-100 text-purple-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Tournaments</h1>
                    <p className="text-gray-600 mt-2">Manage your organized tournaments</p>
                </div>
                <Link
                    to="/tournaments/create"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
                >
                    + Create Tournament
                </Link>
            </div>

            {tournaments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments yet</h3>
                    <p className="text-gray-500 mb-6">Get started by creating your first tournament</p>
                    <Link
                        to="/tournaments/create"
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                    >
                        Create Tournament
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {tournaments.map((tournament) => (
                        <div key={tournament._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{tournament.name}</h3>
                                        <p className="text-gray-600 mt-1">{tournament.description}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(tournament.status)}`}>
                                        {tournament.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
                                    <div>
                                        <span className="text-gray-500">Venue:</span>
                                        <span className="ml-2 font-medium">{tournament.venue}, {tournament.city}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Start:</span>
                                        <span className="ml-2 font-medium">{new Date(tournament.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Categories:</span>
                                        <span className="ml-2 font-medium">{tournament.categories.length}</span>
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="border-t border-gray-200 pt-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">Categories & Brackets</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {tournament.categories.map((cat) => (
                                            <div key={cat.name} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                                <div>
                                                    <p className="font-medium">{getCategoryLabel(cat.name)}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {tournament.registrationCounts?.[cat.name] || 0} / {cat.maxParticipants} registered
                                                    </p>
                                                </div>
                                                {tournament.status === 'registration_closed' || tournament.status === 'in_progress' ? (
                                                    <button
                                                        onClick={() => handleGenerateBrackets(tournament._id, cat.name)}
                                                        disabled={generatingBrackets}
                                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                                                    >
                                                        Generate Brackets
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-500">Awaiting close</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                                    <Link
                                        to={`/tournaments/${tournament._id}`}
                                        className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800"
                                    >
                                        View Details
                                    </Link>

                                    <Link
                                        to={`/tournaments/${tournament._id}/brackets`}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                                    >
                                        View Brackets
                                    </Link>

                                    {tournament.status === 'draft' && (
                                        <>
                                            <button
                                                onClick={() => handlePublish(tournament._id)}
                                                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                                            >
                                                Publish
                                            </button>
                                            <Link
                                                to={`/tournaments/${tournament._id}/edit`}
                                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
                                            >
                                                Edit
                                            </Link>
                                        </>
                                    )}

                                    {(tournament.status === 'draft' || tournament.status === 'cancelled') && (
                                        <button
                                            onClick={() => handleDelete(tournament._id)}
                                            className="border border-red-300 text-red-600 px-4 py-2 rounded-md text-sm hover:bg-red-50 ml-auto"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTournaments;
