import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    XMarkIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentIcon,
    DocumentTextIcon,
    UserIcon,
    MapPinIcon,
    PhoneIcon,
    TrophyIcon,
    AcademicCapIcon,
    ClockIcon,
    EyeIcon,
    ArrowDownTrayIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { cld, getPublicIdFromUrl } from '../utils/cloudinary';
import { AdvancedImage } from '@cloudinary/react';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Server base URL for static files (remove /api suffix if present)
const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const ADMIN_TABS = new Set(['overview', 'verification', 'users', 'bookings', 'tournaments', 'courts']);

const AdminDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [courts, setCourts] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [userFilters, setUserFilters] = useState({ role: '', verified: '', search: '' });

    // Modal states
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [imageLoadState, setImageLoadState] = useState('loading'); // 'loading', 'loaded', 'error'

    useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            navigate('/app');
        } else if (user?.role === 'admin') {
            fetchData();
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab');
        if (tab && ADMIN_TABS.has(tab)) {
            setActiveTab(tab);
        }
    }, [location.search]);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'verification') fetchPendingUsers();
        if (activeTab === 'bookings') fetchBookings();
        if (activeTab === 'tournaments') fetchTournaments();
        if (activeTab === 'courts') fetchCourts();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
    }, [userFilters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const statsData = await adminService.getStats();
            setStats(statsData.data);
            if (activeTab === 'users') await fetchUsers();
            if (activeTab === 'verification') await fetchPendingUsers();
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await adminService.getAllUsers(userFilters);
            setUsers(data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchPendingUsers = async () => {
        try {
            const data = await adminService.getPendingUsers();
            setPendingUsers(data.data);
        } catch (error) {
            console.error('Error fetching pending users:', error);
        }
    };

    const fetchBookings = async () => {
        try {
            const data = await adminService.getAllBookings();
            setBookings(data.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const fetchTournaments = async () => {
        try {
            const data = await adminService.getAllTournaments();
            setTournaments(data.data);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        }
    };

    const fetchCourts = async () => {
        try {
            const data = await adminService.getAllCourts();
            setCourts(data.data);
        } catch (error) {
            console.error('Error fetching courts:', error);
        }
    };

    const handleUserUpdate = async (id, updates) => {
        try {
            await adminService.updateUser(id, updates);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user');
        }
    };

    const handleViewUser = async (userId) => {
        try {
            const data = await adminService.getUserDetails(userId);
            setSelectedUser(data.data);
            setShowUserModal(true);
            setRejectionReason('');
            setImageLoadState('loading'); // Reset image load state
        } catch (error) {
            console.error('Error fetching user details:', error);
            alert('Failed to load user details');
        }
    };

    const handleApproveUser = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await adminService.approveUser(selectedUser._id);
            setShowUserModal(false);
            setSelectedUser(null);
            fetchPendingUsers();
            fetchData();
            alert('User approved successfully!');
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Failed to approve user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectUser = async () => {
        if (!selectedUser) return;
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }
        setActionLoading(true);
        try {
            await adminService.rejectUser(selectedUser._id, rejectionReason);
            setShowUserModal(false);
            setSelectedUser(null);
            setRejectionReason('');
            fetchPendingUsers();
            fetchData();
            alert('User rejected');
        } catch (error) {
            console.error('Error rejecting user:', error);
            alert('Failed to reject user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTournament = async (id) => {
        if (!window.confirm('Delete this tournament? This cannot be undone.')) return;
        try {
            await adminService.deleteTournament(id);
            setTournaments(tournaments.filter(t => t._id !== id));
        } catch (error) {
            console.error(error);
            alert('Failed to delete tournament');
        }
    };

    const handleDeleteCourt = async (id) => {
        if (!window.confirm('Delete this court? This cannot be undone.')) return;
        try {
            await adminService.deleteCourt(id);
            setCourts(courts.filter(c => c._id !== id));
        } catch (error) {
            console.error(error);
            alert('Failed to delete court');
        }
    };

    const getDocumentUrl = (docUrl) => {
        if (!docUrl) return null;
        // All documents are now Cloudinary URLs (starting with http)
        return docUrl;
    };

    const isImageFile = (url) => {
        if (!url) return false;
        // Cloudinary handles both images and PDFs; we assume verified docs are images for this preview
        return url.startsWith('http');
    };

    const getRoleIcon = (role, skillLevel) => {
        if (role === 'coach') return <AcademicCapIcon className="h-5 w-5" />;
        if (role === 'player' && skillLevel === 'professional') return <TrophyIcon className="h-5 w-5" />;
        return <UserIcon className="h-5 w-5" />;
    };

    const getRoleLabel = (role, skillLevel) => {
        if (role === 'coach') return 'Coach';
        if (role === 'organizer') return 'Organizer';
        if (role === 'player' && skillLevel === 'professional') return 'Professional Player';
        return role || 'Unknown';
    };

    if (authLoading || loading && !stats) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading Admin Dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchData}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="hidden sm:inline">Sync Now</span>
                            </button>
                            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded">Super Admin</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
                        <StatCard title="Total Users" value={stats.users.total} subtext={`${stats.users.players} Players`} color="blue" />
                        <StatCard
                            title="Pending"
                            value={stats.users.pendingVerification || 0}
                            subtext="Awaiting review"
                            color="amber"
                            highlight={stats.users.pendingVerification > 0}
                        />
                        <StatCard title="Bookings" value={stats.bookings.active} subtext={`Total: ${stats.bookings.total}`} color="green" />
                        <StatCard title="Tournaments" value={stats.tournaments.active} subtext={`Total: ${stats.tournaments.total}`} color="orange" />
                        <StatCard title="Revenue" value={`₨${stats.bookings.revenue}`} subtext="From bookings" color="indigo" className="col-span-2 lg:col-span-1" />
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                    <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max px-1">
                        {['overview', 'verification', 'users', 'bookings', 'tournaments', 'courts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${activeTab === tab
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm capitalize flex items-center gap-2`}
                            >
                                {tab}
                                {tab === 'verification' && stats?.users?.pendingVerification > 0 && (
                                    <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {stats.users.pendingVerification}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white shadow rounded-lg">
                    {activeTab === 'overview' && (
                        <div className="p-4 sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">System Overview</h3>
                            <p className="text-gray-500">Welcome to the SportSphere Admin Panel. Use the tabs above to manage resources.</p>
                            {stats?.users?.pendingVerification > 0 && (
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-amber-800 font-medium">
                                        ⚠️ You have {stats.users.pendingVerification} user(s) awaiting verification.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('verification')}
                                        className="mt-2 text-amber-600 hover:text-amber-800 font-semibold text-sm"
                                    >
                                        Review now →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'verification' && (
                        <div className="p-4 sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Verification Requests</h3>
                            {pendingUsers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                    <p>No pending verification requests</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="sm:hidden space-y-4">
                                        {pendingUsers.map((u) => (
                                            <div key={u._id} className="bg-gray-50 rounded-xl p-4">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                                        {getRoleIcon(u.role, u.skillLevel)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                                                        <p className="text-sm text-gray-500 truncate">{u.email}</p>
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
                                                            {getRoleLabel(u.role, u.skillLevel)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                                    <span>{u.city || 'No city'}</span>
                                                    <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleViewUser(u._id)}
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                                                >
                                                    Review Application
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {pendingUsers.map((u) => (
                                                    <tr key={u._id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                                    {getRoleIcon(u.role, u.skillLevel)}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                                                    <div className="text-sm text-gray-500">{u.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 capitalize">
                                                                {getRoleLabel(u.role, u.skillLevel)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {u.city || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(u.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleViewUser(u._id)}
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                                                            >
                                                                Review
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="flex-1 sm:flex-none sm:w-48 border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={userFilters.search}
                                    onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                />
                                <select
                                    className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={userFilters.role}
                                    onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                                >
                                    <option value="">All Roles</option>
                                    <option value="player">Player</option>
                                    <option value="coach">Coach</option>
                                    <option value="organizer">Organizer</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <select
                                    className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={userFilters.verified}
                                    onChange={(e) => setUserFilters({ ...userFilters, verified: e.target.value })}
                                >
                                    <option value="">All Status</option>
                                    <option value="true">Verified</option>
                                    <option value="false">Unverified</option>
                                </select>
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden space-y-3">
                                {users.map((u) => (
                                    <div key={u._id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{u.name}</p>
                                            <p className="text-sm text-gray-500 truncate">{u.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 capitalize">{u.role}</span>
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${u.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {u.verified ? 'Verified' : 'Unverified'}
                                                </span>
                                            </div>
                                        </div>
                                        {!u.verified ? (
                                            <button
                                                onClick={() => handleUserUpdate(u._id, { verified: true, status: 'approved' })}
                                                className="text-indigo-600 text-sm font-medium ml-3"
                                            >
                                                Verify
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUserUpdate(u._id, { verified: false })}
                                                className="text-red-600 text-sm font-medium ml-3"
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((u) => (
                                            <tr key={u._id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                                    <div className="text-sm text-gray-500">{u.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                    {u.role}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {u.verified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {!u.verified ? (
                                                        <button
                                                            onClick={() => handleUserUpdate(u._id, { verified: true, status: 'approved' })}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            Verify
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUserUpdate(u._id, { verified: false })}
                                                            className="text-red-600 hover:text-red-900 mr-4"
                                                        >
                                                            Unverify
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="p-4 sm:p-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bookings.map((booking) => (
                                        <tr key={booking._id}>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {booking.court?.name}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {booking.user?.name}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(booking.date).toLocaleDateString()} {booking.startTime}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'tournaments' && (
                        <div className="p-4 sm:p-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tournament</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tournaments.map((t) => (
                                        <tr key={t._id}>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {t.name}
                                                <div className="text-xs text-gray-500">{t.city}</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {t.organizer?.name}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(t.startDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.status === 'registration_open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                <button onClick={() => handleDeleteTournament(t._id)} className="hover:text-red-900">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'courts' && (
                        <div className="p-4 sm:p-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {courts.map((court) => (
                                        <tr key={court._id}>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {court.name}
                                                <div className="text-xs text-gray-500">{court.surfaceType}</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {court.owner?.name || 'Unknown'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {court.location?.city}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ₨{court.pricePerHour}/hr
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                <button onClick={() => handleDeleteCourt(court._id)} className="hover:text-red-900">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Backdrop */}
                        <div className="fixed inset-0 transition-opacity bg-gray-900/60" onClick={() => setShowUserModal(false)} />

                        {/* Modal - with relative z-index to appear above backdrop */}
                        <div className="relative z-10 inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-2xl">
                            {/* Header */}
                            <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold text-white">User Verification Review</h3>
                                <button onClick={() => setShowUserModal(false)} className="text-white/80 hover:text-white p-1">
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-4 sm:px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
                                {/* User Info */}
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                        {getRoleIcon(selectedUser.role, selectedUser.skillLevel)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xl font-bold text-gray-900">{selectedUser.name}</h4>
                                        <p className="text-gray-500">{selectedUser.email}</p>
                                        <span className="mt-1 inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-semibold rounded-full">
                                            {getRoleLabel(selectedUser.role, selectedUser.skillLevel)}
                                        </span>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 uppercase">City</p>
                                            <p className="font-medium text-gray-900 truncate">{selectedUser.city || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <PhoneIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 uppercase">Phone</p>
                                            <p className="font-medium text-gray-900 truncate">{selectedUser.phone || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <ClockIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 uppercase">Registered</p>
                                            <p className="font-medium text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {selectedUser.rank && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <TrophyIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-500 uppercase">Rank</p>
                                                <p className="font-medium text-gray-900 truncate">{selectedUser.rank}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedUser.coachLevel && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <AcademicCapIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-500 uppercase">Certification</p>
                                                <p className="font-medium text-gray-900 truncate">{selectedUser.coachLevel}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Achievements */}
                                {selectedUser.achievements && selectedUser.achievements.length > 0 && (
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase mb-2">Achievements</p>
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            {selectedUser.achievements.map((a, i) => (
                                                <li key={i}>• {a}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Verification Document */}
                                {selectedUser.verificationDocument && (
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <DocumentTextIcon className="h-10 w-10 text-blue-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-blue-900">Verification Document</p>
                                                <p className="text-sm text-blue-600 truncate">{selectedUser.verificationDocument.split('/').pop()}</p>
                                            </div>
                                            <div className="flex gap-2 mt-3 sm:mt-0">
                                                {isImageFile(selectedUser.verificationDocument) ? (
                                                    <button
                                                        onClick={() => setShowDocumentModal(true)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        View
                                                    </button>
                                                ) : null}
                                                <a
                                                    href={getDocumentUrl(selectedUser.verificationDocument)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                                                >
                                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                                    Open
                                                </a>
                                            </div>

                                            {/* Image Preview */}
                                            {isImageFile(selectedUser.verificationDocument) && (
                                                <div className="mt-4 border rounded-lg overflow-hidden bg-white">
                                                    <p className="text-xs text-gray-500 p-2 bg-gray-50 border-b">Document Preview:</p>
                                                    <div className="p-2">
                                                        {(() => {
                                                            const publicId = getPublicIdFromUrl(selectedUser.verificationDocument);
                                                            if (publicId) {
                                                                const img = cld.image(publicId)
                                                                    .format('auto')
                                                                    .quality('auto');
                                                                return (
                                                                    <AdvancedImage
                                                                        cldImg={img}
                                                                        className="w-full max-h-64 object-contain"
                                                                    />
                                                                );
                                                            }
                                                            return (
                                                                <img
                                                                    src={getDocumentUrl(selectedUser.verificationDocument)}
                                                                    alt="Verification document preview"
                                                                    className="w-full max-h-64 object-contain"
                                                                    style={{ display: 'block' }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = '';
                                                                        e.target.alt = '❌ Failed to load image';
                                                                        e.target.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100px;background:#fee2e2;color:#dc2626;font-size:14px;';
                                                                        e.target.outerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100px;background:#fee2e2;color:#dc2626;font-size:14px;border-radius:8px;">❌ Failed to load image - try the Open button above</div>';
                                                                    }}
                                                                />
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}

                                            {/* PDF Preview note */}
                                            {selectedUser.verificationDocument && !isImageFile(selectedUser.verificationDocument) && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-center text-sm text-gray-600">
                                                    📄 This is a PDF document. Click "Open" above to view it.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!selectedUser.verificationDocument && (
                                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                        <p className="text-yellow-800 font-medium">⚠️ No verification document uploaded</p>
                                    </div>
                                )}

                                {/* Rejection Reason Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason (required if rejecting)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Enter reason for rejection..."
                                        className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-4 sm:px-6 py-4 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="w-full sm:w-auto px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectUser}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 flex items-center justify-center gap-2"
                                    disabled={actionLoading}
                                >
                                    <XCircleIcon className="h-5 w-5" />
                                    Reject
                                </button>
                                <button
                                    onClick={handleApproveUser}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                                    disabled={actionLoading}
                                >
                                    <CheckCircleIcon className="h-5 w-5" />
                                    Approve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Full View Modal */}
            {showDocumentModal && selectedUser?.verificationDocument && (
                <div className="fixed inset-0 z-[60] flex flex-col bg-black/95">
                    {/* Header with back button */}
                    <div className="flex items-center justify-between p-4 bg-black/50">
                        <button
                            onClick={() => setShowDocumentModal(false)}
                            className="flex items-center gap-2 text-white/90 hover:text-white font-medium"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Review
                        </button>
                        <span className="text-white/60 text-sm truncate max-w-[50%]">
                            {selectedUser.verificationDocument.split('/').pop()}
                        </span>
                        <button
                            onClick={() => setShowDocumentModal(false)}
                            className="text-white/80 hover:text-white p-2"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Image container */}
                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto" onClick={() => setShowDocumentModal(false)}>
                        {(() => {
                            const publicId = getPublicIdFromUrl(selectedUser.verificationDocument);
                            if (publicId) {
                                const img = cld.image(publicId)
                                    .format('auto')
                                    .quality('auto');
                                return (
                                    <AdvancedImage
                                        cldImg={img}
                                        className="max-w-full max-h-full object-contain"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                );
                            }
                            return (
                                <img
                                    src={getDocumentUrl(selectedUser.verificationDocument)}
                                    alt="Verification document"
                                    className="max-w-full max-h-full object-contain"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, subtext, color, highlight, className = '' }) => (
    <div className={`bg-white overflow-hidden shadow rounded-lg border-l-4 border-${color}-500 ${highlight ? 'ring-2 ring-amber-400 ring-offset-2' : ''} ${className}`}>
        <div className="px-3 sm:px-4 py-4 sm:py-5">
            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="mt-1 text-xl sm:text-3xl font-semibold text-gray-900">{value}</dd>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500 truncate">{subtext}</p>
        </div>
    </div>
);

export default AdminDashboard;
