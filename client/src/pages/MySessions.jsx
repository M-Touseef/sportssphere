import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sessionService from '../services/sessionService';
import * as paymentService from '../services/paymentService';
import { useToast } from '../context/ToastContext';

const MySessions = () => {
    const { success, error: toastError } = useToast();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, past
    const [payingSessionId, setPayingSessionId] = useState(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const data = await sessionService.getMySessions();
            setSessions(data.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSession = async (sessionId) => {
        if (!window.confirm('Are you sure you want to cancel this session?')) {
            return;
        }

        try {
            await sessionService.cancelSession(sessionId);
            fetchSessions(); // Refresh the list
        } catch (error) {
            console.error('Error cancelling session:', error);
            alert('Failed to cancel session');
        }
    };

    const handlePayment = async (sessionId) => {
        try {
            setPayingSessionId(sessionId);
            const result = await paymentService.payForSession(sessionId);
            if (result?.completed) {
                success('Session confirmed (demo payment).');
                fetchSessions();
            }
        } catch (err) {
            console.error('Payment error:', err);
            toastError(err?.response?.data?.error || 'Failed to complete payment.');
        } finally {
            setPayingSessionId(null);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            pending_payment: 'bg-amber-100 text-amber-800 border border-amber-200',
            confirmed: 'bg-green-100 text-green-800',
            completed: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const filteredSessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        const now = new Date();

        if (filter === 'upcoming') {
            return sessionDate >= now && session.status !== 'cancelled' && session.status !== 'completed';
        } else if (filter === 'past') {
            return sessionDate < now || session.status === 'completed';
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
                <p className="text-gray-600 mt-2">View and manage your coaching sessions</p>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="flex -mb-px space-x-8">
                    <button
                        onClick={() => setFilter('all')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${filter === 'all'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        All Sessions ({sessions.length})
                    </button>
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${filter === 'upcoming'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilter('past')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${filter === 'past'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Past
                    </button>
                </nav>
            </div>

            {/* Sessions List */}
            {filteredSessions.length > 0 ? (
                <div className="space-y-4">
                    {filteredSessions.map((session) => (
                        <div key={session._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                Coach: {session.coach.name}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                                {session.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm">{session.coach.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blue-600">Rs. {session.totalPrice}</p>
                                        <p className="text-sm text-gray-500">{session.duration} hour(s)</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center text-gray-600">
                                        <span className="mr-2">📅</span>
                                        <span>{new Date(session.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <span className="mr-2">🕐</span>
                                        <span>{session.startTime} - {session.endTime}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <span className="mr-2">📍</span>
                                        <span>{session.location}</span>
                                    </div>
                                </div>

                                {session.notes && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Notes:</span> {session.notes}
                                        </p>
                                    </div>
                                )}

                                {session.status === 'pending_payment' && (
                                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-amber-800 text-sm">
                                            <span className="text-xl">💳</span>
                                            <div>
                                                <p className="font-bold">Payment Required</p>
                                                <p>Coach has accepted! Pay Rs. {session.totalPrice} to confirm your slot.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handlePayment(session._id)}
                                            disabled={payingSessionId === session._id}
                                            className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-bold shadow-md shadow-amber-200 transition-all text-sm disabled:opacity-60"
                                        >
                                            {payingSessionId === session._id ? 'Processing…' : 'Confirm payment'}
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    {(session.status === 'confirmed' || session.status === 'pending') && new Date(session.date) > new Date() && (
                                        <button
                                            onClick={() => handleCancelSession(session._id)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                                        >
                                            Cancel Session
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 mb-4 text-lg">No sessions scheduled yet.</p>
                    <p className="text-gray-400 mb-8">Book a coach to improve your skills!</p>
                    <Link
                        to="/coaches"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all"
                    >
                        Find a Coach
                    </Link>
                </div>
            )}
        </div>
    );
};

export default MySessions;
