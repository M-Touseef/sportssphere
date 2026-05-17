import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import coachService from '../services/coachService';
import sessionService from '../services/sessionService';
import courtService from '../services/courtService';
import CoachProfileForm from '../components/CoachProfileForm';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import {
    PlusIcon,
    CalendarIcon,
    ClockIcon,
    MapPinIcon,
    CheckBadgeIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const CoachDashboard = () => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [sessions, setSessions] = useState([]);
    const [profile, setProfile] = useState(null);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sessions');

    // Publish Form State
    const [publishData, setPublishData] = useState({
        courtId: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: 1,
        planType: 'hourly',
        sessionType: 'individual',
        notes: ''
    });
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [sessionsData, profileData, courtsData] = await Promise.all([
                sessionService.getCoachSessions(),
                coachService.getMyProfile().catch(() => ({ data: null })),
                courtService.getCourts()
            ]);
            setSessions(sessionsData.data);
            setProfile(profileData.data);
            setCourts(courtsData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublishSession = async (e) => {
        e.preventDefault();
        setPublishing(true);
        try {
            await sessionService.publishSession(publishData);
            success('Session published successfully!');
            setPublishData({
                courtId: '',
                date: '',
                startTime: '',
                endTime: '',
                duration: 1,
                planType: 'hourly',
                sessionType: 'individual',
                notes: ''
            });
            setActiveTab('sessions');
            fetchData();
        } catch (error) {
            console.error('Error publishing session:', error);
            toastError(error.response?.data?.error || 'Failed to publish session');
        } finally {
            setPublishing(false);
        }
    };

    const handleConfirmSession = async (sessionId) => {
        try {
            await coachService.confirmSession(sessionId);
            // Update local state without full refetch for better UX
            setSessions(sessions.map(s =>
                s._id === sessionId ? { ...s, status: 'confirmed' } : s
            ));
        } catch (error) {
            console.error('Error confirming session:', error);
            alert('Failed to confirm session');
        }
    };

    const handleRejectSession = async (sessionId) => {
        if (!window.confirm('Are you sure you want to reject this request?')) return;

        try {
            await coachService.rejectSession(sessionId);
            setSessions(sessions.map(s =>
                s._id === sessionId ? { ...s, status: 'cancelled' } : s
            ));
        } catch (error) {
            console.error('Error rejecting session:', error);
            alert('Failed to reject session');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-green-100 text-green-800',
            completed: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const pendingRequests = sessions.filter(s => s.status === 'pending');

    const upcomingSessions = sessions.filter(s =>
        s.status === 'confirmed' && new Date(s.date) >= new Date()
    );
    const pastSessions = sessions.filter(s =>
        s.status === 'completed' || new Date(s.date) < new Date()
    );

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
                <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-gray-500 text-sm mb-1">Total Sessions</div>
                    <div className="text-3xl font-bold text-gray-900">{sessions.length}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-gray-500 text-sm mb-1">Upcoming</div>
                    <div className="text-3xl font-bold text-blue-600">{upcomingSessions.length}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-gray-500 text-sm mb-1">Completed</div>
                    <div className="text-3xl font-bold text-green-600">{pastSessions.filter(s => s.status === 'completed').length}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-gray-500 text-sm mb-1">Pending requests</div>
                    <div className="text-3xl font-bold text-amber-600">{pendingRequests.length}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('sessions')}
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'sessions'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Sessions
                        </button>
                        <button
                            onClick={() => setActiveTab('publish')}
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'publish'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Publish Session
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'profile'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Profile
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'sessions' && (
                        <div className="space-y-6">

                            {/* Pending Requests Section */}
                            {pendingRequests.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                                    <h3 className="text-lg font-semibold text-yellow-800 mb-4">Pending Requests ({pendingRequests.length})</h3>
                                    <div className="space-y-4">
                                        {pendingRequests.map((session) => (
                                            <div key={session._id} className="bg-white border border-yellow-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-900">{session.student.name}</h4>
                                                        <p className="text-sm text-gray-600">{session.student.email}</p>
                                                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                                                            <span>📅 {new Date(session.date).toLocaleDateString()}</span>
                                                            <span>🕐 {session.startTime} - {session.endTime}</span>
                                                            <span>📍 {session.location}</span>
                                                        </div>
                                                        {session.notes && (
                                                            <p className="mt-2 text-sm text-gray-500 italic">Note: "{session.notes}"</p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2 ml-4">
                                                        <button
                                                            onClick={() => handleConfirmSession(session._id)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectSession(session._id)}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Upcoming Confirmed Sessions</h3>
                                {upcomingSessions.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcomingSessions.map((session) => (
                                            <div key={session._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-900">{session.student.name}</h4>
                                                        <p className="text-sm text-gray-600">{session.student.email}</p>
                                                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                                                            <span>📅 {new Date(session.date).toLocaleDateString()}</span>
                                                            <span>🕐 {session.startTime} - {session.endTime}</span>
                                                            <span>📍 {session.location}</span>
                                                        </div>
                                                        {session.notes && (
                                                            <p className="mt-2 text-sm text-gray-500 italic">{session.notes}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                                            {session.status}
                                                        </span>
                                                        <p className="mt-2 text-sm font-medium text-gray-900">Rs. {session.totalPrice}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No upcoming sessions</p>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold mb-4">Past Sessions</h3>
                                {pastSessions.length > 0 ? (
                                    <div className="space-y-4">
                                        {pastSessions.slice(0, 5).map((session) => (
                                            <div key={session._id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-900">{session.student.name}</h4>
                                                        <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
                                                            <span>📅 {new Date(session.date).toLocaleDateString()}</span>
                                                            <span>🕐 {session.startTime} - {session.endTime}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                                            {session.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No past sessions</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'publish' && (
                        <div className="max-w-2xl mx-auto">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Publish Training Session</h3>
                            <form onSubmit={handlePublishSession} className="space-y-6 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Court</label>
                                        <select
                                            value={publishData.courtId}
                                            onChange={(e) => setPublishData({ ...publishData, courtId: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                            required
                                        >
                                            <option value="">Select a court</option>
                                            {courts.map(court => (
                                                <option key={court._id} value={court._id}>{court.name} ({court.location})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
                                        <input
                                            type="date"
                                            value={publishData.date}
                                            onChange={(e) => setPublishData({ ...publishData, date: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Start Time</label>
                                        <input
                                            type="time"
                                            value={publishData.startTime}
                                            onChange={(e) => setPublishData({ ...publishData, startTime: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">End Time</label>
                                        <input
                                            type="time"
                                            value={publishData.endTime}
                                            onChange={(e) => setPublishData({ ...publishData, endTime: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Duration (Hours)</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0.5"
                                            value={publishData.duration}
                                            onChange={(e) => setPublishData({ ...publishData, duration: parseFloat(e.target.value) })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Plan Type</label>
                                        <select
                                            value={publishData.planType}
                                            onChange={(e) => setPublishData({ ...publishData, planType: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                        >
                                            <option value="hourly">Hourly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Training Notes</label>
                                    <textarea
                                        value={publishData.notes}
                                        onChange={(e) => setPublishData({ ...publishData, notes: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-blue-100 outline-none h-24 resize-none"
                                        placeholder="Specific focus areas for this session..."
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    fullWidth
                                    isLoading={publishing}
                                    className="h-14 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-100"
                                >
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Publish Training Slot
                                </Button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div>
                            <CoachProfileForm
                                existingProfile={profile}
                                onSuccess={fetchData}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoachDashboard;
