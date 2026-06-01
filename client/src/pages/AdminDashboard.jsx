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
    const [, setImageLoadState] = useState('loading'); // 'loading', 'loaded', 'error'

    useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            navigate('/app');
        } else if (user?.role === 'admin') {
            fetchData();
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        }
    // fetchData is intentionally refreshed through this role-aware polling effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Loaders are selected by the active tab and do not need to restart this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
    // Refetch users whenever the filter values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pb-12">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] sticky top-0 z-40">
                <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
                            <p className="text-sm text-slate-500 font-medium mt-1">System Management & Operations</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
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
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] border border-slate-200/60 mb-8 overflow-hidden">
                    <nav className="flex space-x-1 px-2 py-2">
                        {['overview', 'verification', 'users', 'bookings', 'tournaments', 'courts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${activeTab === tab
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    } whitespace-nowrap px-4 py-2.5 rounded-xl font-semibold text-sm capitalize flex items-center gap-2 transition-all duration-200`}
                            >
                                {tab}
                                {tab === 'verification' && stats?.users?.pendingVerification > 0 && (
                                    <span className={`${activeTab === tab ? 'bg-white/20' : 'bg-amber-500'} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center`}>
                                        {stats.users.pendingVerification}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] border border-slate-200/60 overflow-hidden">
                    {activeTab === 'overview' && (
                        <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">System Overview</h3>
                                    <p className="text-slate-500 font-medium">Welcome to the SportSphere Admin Panel</p>
                                </div>
                            </div>
                            <p className="text-slate-600 leading-relaxed mb-6">Use the navigation tabs above to manage users, bookings, tournaments, and court resources efficiently.</p>
                            {stats?.users?.pendingVerification > 0 && (
                                <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-amber-900 font-bold text-lg">
                                                {stats.users.pendingVerification} user(s) awaiting verification
                                            </p>
                                            <button
                                                onClick={() => setActiveTab('verification')}
                                                className="mt-2 text-amber-700 hover:text-amber-900 font-semibold text-sm flex items-center gap-1"
                                            >
                                                Review now
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'verification' && (
                        <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                                    <ShieldCheckIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">Verification Requests</h3>
                                    <p className="text-slate-500 font-medium">Review and approve user applications</p>
                                </div>
                            </div>
                            {pendingUsers.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="h-20 w-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
                                    </div>
                                    <p className="text-slate-600 font-semibold text-lg">No pending verification requests</p>
                                    <p className="text-slate-400 text-sm mt-1">All caught up!</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="sm:hidden space-y-4">
                                        {pendingUsers.map((u) => (
                                            <div key={u._id} className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                                                        {getRoleIcon(u.role, u.skillLevel)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 truncate text-lg">{u.name}</p>
                                                        <p className="text-sm text-slate-500 truncate">{u.email}</p>
                                                        <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-bold rounded-lg">
                                                            {getRoleLabel(u.role, u.skillLevel)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-slate-500 mb-4 px-2">
                                                    <span className="font-medium">{u.city || 'No city'}</span>
                                                    <span className="text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleViewUser(u._id)}
                                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-indigo-200 transition-all duration-200"
                                                >
                                                    Review Application
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">City</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Registered</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-100">
                                                {pendingUsers.map((u) => (
                                                    <tr key={u._id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                                                    {getRoleIcon(u.role, u.skillLevel)}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-slate-900">{u.name}</div>
                                                                    <div className="text-sm text-slate-500">{u.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 capitalize">
                                                                {getRoleLabel(u.role, u.skillLevel)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                                                            {u.city || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                            {new Date(u.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleViewUser(u._id)}
                                                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all duration-200"
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
                        <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <UserIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">User Management</h3>
                                    <p className="text-slate-500 font-medium">View and manage all registered users</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="flex-1 sm:flex-none sm:w-64 border border-slate-200/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                                    value={userFilters.search}
                                    onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                />
                                <select
                                    className="border border-slate-200/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
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
                                    className="border border-slate-200/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
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
                                    <div key={u._id} className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 truncate text-lg">{u.name}</p>
                                                <p className="text-sm text-slate-500 truncate">{u.email}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs font-semibold text-slate-500 capitalize">{u.role}</span>
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${u.verified ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700' : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700'}`}>
                                                        {u.verified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </div>
                                            </div>
                                            {!u.verified ? (
                                                <button
                                                    onClick={() => handleUserUpdate(u._id, { verified: true, status: 'approved' })}
                                                    className="ml-3 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 text-sm"
                                                >
                                                    Verify
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUserUpdate(u._id, { verified: false })}
                                                    className="ml-3 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-md shadow-red-200 text-sm"
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {users.map((u) => (
                                            <tr key={u._id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-slate-900">{u.name}</div>
                                                    <div className="text-sm text-slate-500">{u.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 capitalize">
                                                    {u.role}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${u.verified ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700' : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700'}`}>
                                                        {u.verified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {!u.verified ? (
                                                        <button
                                                            onClick={() => handleUserUpdate(u._id, { verified: true, status: 'approved' })}
                                                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 text-sm mr-3 hover:from-emerald-600 hover:to-green-700 transition-all"
                                                        >
                                                            Verify
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUserUpdate(u._id, { verified: false })}
                                                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-md shadow-red-200 text-sm mr-3 hover:from-red-600 hover:to-rose-700 transition-all"
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
                        <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <ClockIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">Bookings</h3>
                                    <p className="text-slate-500 font-medium">View all court bookings</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Court</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {bookings.map((booking) => (
                                            <tr key={booking._id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                    {booking.court?.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {booking.user?.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {new Date(booking.date).toLocaleDateString()} {booking.startTime}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${booking.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700' : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700'}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tournaments' && (
                        <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                                    <TrophyIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">Tournaments</h3>
                                    <p className="text-slate-500 font-medium">Manage tournament events</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tournament</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Organizer</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {tournaments.map((t) => (
                                            <tr key={t._id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                    {t.name}
                                                    <div className="text-xs text-slate-500">{t.city}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {t.organizer?.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {new Date(t.startDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${t.status === 'registration_open' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700' : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700'}`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button onClick={() => handleDeleteTournament(t._id)} className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-md shadow-red-200 text-sm hover:from-red-600 hover:to-rose-700 transition-all">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'courts' && (
                        <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                                    <MapPinIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">Courts</h3>
                                    <p className="text-slate-500 font-medium">Manage sports courts</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Court</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {courts.map((court) => (
                                            <tr key={court._id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                    {court.name}
                                                    <div className="text-xs text-slate-500">{court.surfaceType}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {court.owner?.name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {court.location?.city}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    ₨{court.pricePerHour}/hr
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button onClick={() => handleDeleteCourt(court._id)} className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-md shadow-red-200 text-sm hover:from-red-600 hover:to-rose-700 transition-all">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Backdrop */}
                        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setShowUserModal(false)} />

                        {/* Modal */}
                        <div className="relative z-10 inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-3xl shadow-2xl">
                            {/* Header */}
                            <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <ShieldCheckIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-white">User Verification Review</h3>
                                </div>
                                <button onClick={() => setShowUserModal(false)} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-6 sm:px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                {/* User Info */}
                                <div className="flex flex-col sm:flex-row items-start gap-5 p-5 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200/60">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                                        {getRoleIcon(selectedUser.role, selectedUser.skillLevel)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h4>
                                        <p className="text-slate-600 font-medium">{selectedUser.email}</p>
                                        <span className="mt-2 inline-block px-4 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-bold rounded-lg">
                                            {getRoleLabel(selectedUser.role, selectedUser.skillLevel)}
                                        </span>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200/60">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <MapPinIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">City</p>
                                            <p className="font-bold text-slate-900 truncate">{selectedUser.city || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200/60">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <PhoneIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                                            <p className="font-bold text-slate-900 truncate">{selectedUser.phone || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200/60">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <ClockIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered</p>
                                            <p className="font-bold text-slate-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {selectedUser.rank && (
                                        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200/60">
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <TrophyIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rank</p>
                                                <p className="font-bold text-slate-900 truncate">{selectedUser.rank}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedUser.coachLevel && (
                                        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200/60">
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <AcademicCapIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Certification</p>
                                                <p className="font-bold text-slate-900 truncate">{selectedUser.coachLevel}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Achievements */}
                                {selectedUser.achievements && selectedUser.achievements.length > 0 && (
                                    <div className="p-5 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200/60">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Achievements</p>
                                        <ul className="text-sm text-slate-700 space-y-2">
                                            {selectedUser.achievements.map((a, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="text-indigo-500 mt-0.5">•</span>
                                                    <span>{a}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Verification Document */}
                                {selectedUser.verificationDocument && (
                                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/60">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-blue-900">Verification Document</p>
                                                <p className="text-sm text-blue-600 truncate">{selectedUser.verificationDocument.split('/').pop()}</p>
                                            </div>
                                            <div className="flex gap-2 mt-3 sm:mt-0">
                                                {isImageFile(selectedUser.verificationDocument) ? (
                                                    <button
                                                        onClick={() => setShowDocumentModal(true)}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        View
                                                    </button>
                                                ) : null}
                                                <a
                                                    href={getDocumentUrl(selectedUser.verificationDocument)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 border border-blue-300 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
                                                >
                                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                                    Open
                                                </a>
                                            </div>

                                            {/* Image Preview */}
                                            {isImageFile(selectedUser.verificationDocument) && (
                                                <div className="mt-5 border border-slate-200/60 rounded-2xl overflow-hidden bg-white shadow-sm">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider p-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200/60">Document Preview:</p>
                                                    <div className="p-3">
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
                                                <div className="mt-5 p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200/60 text-center text-sm text-slate-600">
                                                    📄 This is a PDF document. Click "Open" above to view it.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!selectedUser.verificationDocument && (
                                    <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <p className="text-amber-900 font-bold">No verification document uploaded</p>
                                        </div>
                                    </div>
                                )}

                                {/* Rejection Reason Input */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">
                                        Rejection Reason (required if rejecting)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Enter reason for rejection..."
                                        className="w-full p-4 border border-slate-200/60 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-slate-200/60 flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="w-full sm:w-auto px-5 py-3 text-slate-700 bg-white border border-slate-200/60 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectUser}
                                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold shadow-md shadow-red-200 hover:from-red-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2"
                                    disabled={actionLoading}
                                >
                                    <XCircleIcon className="h-5 w-5" />
                                    Reject
                                </button>
                                <button
                                    onClick={handleApproveUser}
                                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 hover:from-emerald-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"
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
                <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900/95 backdrop-blur-xl">
                    {/* Header with back button */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50">
                        <button
                            onClick={() => setShowDocumentModal(false)}
                            className="flex items-center gap-2 text-white/90 hover:text-white font-semibold transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Review
                        </button>
                        <span className="text-white/60 text-sm font-medium truncate max-w-[50%]">
                            {selectedUser.verificationDocument.split('/').pop()}
                        </span>
                        <button
                            onClick={() => setShowDocumentModal(false)}
                            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Image container */}
                    <div className="flex-1 flex items-center justify-center p-6 overflow-auto" onClick={() => setShowDocumentModal(false)}>
                        {(() => {
                            const publicId = getPublicIdFromUrl(selectedUser.verificationDocument);
                            if (publicId) {
                                const img = cld.image(publicId)
                                    .format('auto')
                                    .quality('auto');
                                return (
                                    <AdvancedImage
                                        cldImg={img}
                                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                );
                            }
                            return (
                                <img
                                    src={getDocumentUrl(selectedUser.verificationDocument)}
                                    alt="Verification document"
                                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
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

const StatCard = ({ title, value, subtext, color, highlight, className = '' }) => {
    const colorGradients = {
        blue: 'from-blue-500 to-indigo-600',
        amber: 'from-amber-500 to-orange-600',
        green: 'from-emerald-500 to-green-600',
        orange: 'from-orange-500 to-red-500',
        indigo: 'from-indigo-500 to-purple-600'
    };
    
    return (
        <div className={`bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] border border-slate-200/60 overflow-hidden ${highlight ? 'ring-2 ring-amber-400 ring-offset-2' : ''} ${className} hover:shadow-lg transition-shadow duration-300`}>
            <div className={`h-1.5 bg-gradient-to-r ${colorGradients[color] || colorGradients.blue}`}></div>
            <div className="px-4 sm:px-5 py-5 sm:py-6">
                <dt className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</dt>
                <dd className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</dd>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">{subtext}</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
