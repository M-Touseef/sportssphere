import { createElement, useState, useEffect } from 'react';
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
    ShieldCheckIcon,
    Squares2X2Icon,
    UserGroupIcon,
    CalendarDaysIcon,
    BuildingOffice2Icon,
    BanknotesIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { cld, getPublicIdFromUrl } from '../utils/cloudinary';
import { AdvancedImage } from '@cloudinary/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Server base URL for static files (remove /api suffix if present)
const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const ADMIN_TABS = new Set(['overview', 'verification', 'users', 'bookings', 'tournaments', 'courts']);

const ADMIN_TAB_ITEMS = [
    { key: 'overview', label: 'Overview', icon: Squares2X2Icon },
    { key: 'verification', label: 'Verification', icon: ShieldCheckIcon },
    { key: 'users', label: 'Users', icon: UserGroupIcon },
    { key: 'bookings', label: 'Bookings', icon: CalendarDaysIcon },
    { key: 'tournaments', label: 'Tournaments', icon: TrophyIcon },
    { key: 'courts', label: 'Courts', icon: BuildingOffice2Icon },
];

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
        <div className="flex min-h-[60vh] items-center justify-center bg-[#f4f9fc]">
            <div className="text-center">
                <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-sky-100 border-t-brand-sky" />
                <p className="mt-4 text-sm font-bold text-brand-navy">Preparing admin workspace...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f4f9fc] pb-16">
            <main className="mx-auto max-w-[92rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <section className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-navy-deep via-brand-navy to-sky-800 p-6 text-white shadow-[0_28px_70px_-34px_rgba(3,20,47,0.75)] sm:p-8 lg:p-10">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-sky/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-brand-lime/15 blur-3xl" />
                    <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_14px_rgba(163,230,53,0.8)]" />
                                Platform control center
                            </div>
                            <h1 className="max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">Keep SportsSphere running smoothly.</h1>
                            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-sky-100/70 sm:text-base">
                                Review accounts, monitor activity, and manage courts and competitions from one focused workspace.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">Needs attention</p>
                            <div className="mt-3 flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-4xl font-black text-white">{stats?.users?.pendingVerification || 0}</p>
                                    <p className="mt-1 text-xs font-semibold text-sky-100/65">verification requests</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('verification')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-4 py-2.5 text-xs font-black text-brand-navy transition hover:bg-lime-300"
                                >
                                    Review
                                    <ArrowRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Stats Grid */}
                {stats && (
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                        <StatCard title="Total Users" value={stats.users.total} subtext={`${stats.users.players} players`} tone="navy" icon={UserGroupIcon} />
                        <StatCard
                            title="Pending"
                            value={stats.users.pendingVerification || 0}
                            subtext="Awaiting review"
                            tone="lime"
                            icon={ShieldCheckIcon}
                            highlight={stats.users.pendingVerification > 0}
                        />
                        <StatCard title="Bookings" value={stats.bookings.active} subtext={`${stats.bookings.total} total`} tone="sky" icon={CalendarDaysIcon} />
                        <StatCard title="Tournaments" value={stats.tournaments.active} subtext={`${stats.tournaments.total} total`} tone="navy" icon={TrophyIcon} />
                        <StatCard title="Revenue" value={`Rs. ${Number(stats.bookings.revenue || 0).toLocaleString()}`} subtext="From bookings" tone="lime" icon={BanknotesIcon} className="col-span-2 lg:col-span-1" />
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="sticky top-[92px] z-30 mb-6 overflow-x-auto rounded-2xl border border-sky-100 bg-white/90 p-2 shadow-[0_16px_40px_-28px_rgba(3,20,47,0.55)] backdrop-blur-xl">
                    <nav className="flex min-w-max gap-1" aria-label="Admin sections">
                        {ADMIN_TAB_ITEMS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`${activeTab === tab.key
                                    ? 'bg-brand-navy text-white shadow-lg shadow-slate-900/15'
                                    : 'text-slate-600 hover:bg-sky-50 hover:text-brand-navy'
                                    } flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-all`}
                            >
                                {createElement(tab.icon, { className: 'h-4 w-4' })}
                                {tab.label}
                                {tab.key === 'verification' && stats?.users?.pendingVerification > 0 && (
                                    <span className={`${activeTab === tab.key ? 'bg-lime-400 text-brand-navy' : 'bg-lime-100 text-lime-800'} min-w-6 rounded-full px-2 py-0.5 text-center text-[10px] font-black`}>
                                        {stats.users.pendingVerification}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-[0_22px_55px_-36px_rgba(3,20,47,0.5)]">
                    {activeTab === 'overview' && (
                        <div className="p-6 sm:p-8">
                            <SectionHeading icon={Squares2X2Icon} title="System overview" description="Choose an area to review or manage." tone="navy" />
                            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {ADMIN_TAB_ITEMS.slice(1).map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setActiveTab(item.key)}
                                        className="group flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50"
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm transition group-hover:bg-brand-sky group-hover:text-brand-navy">
                                            {createElement(item.icon, { className: 'h-5 w-5' })}
                                        </span>
                                        <span>
                                            <span className="block text-sm font-black text-brand-navy">{item.label}</span>
                                            <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Open management</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {stats?.users?.pendingVerification > 0 && (
                                <div className="rounded-2xl border border-lime-200 bg-lime-50 p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-lime-400 text-brand-navy">
                                            <ShieldCheckIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-lg font-black text-brand-navy">
                                                {stats.users.pendingVerification} user(s) awaiting verification
                                            </p>
                                            <button
                                                onClick={() => setActiveTab('verification')}
                                                className="mt-2 flex items-center gap-1 text-sm font-bold text-lime-800 hover:text-brand-navy"
                                            >
                                                Review now
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'verification' && (
                        <div className="p-6 sm:p-8">
                            <SectionHeading icon={ShieldCheckIcon} title="Verification requests" description="Review documents and approve trusted accounts." tone="lime" />
                            {pendingUsers.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-lime-100">
                                        <CheckCircleIcon className="h-10 w-10 text-lime-700" />
                                    </div>
                                    <p className="text-slate-600 font-semibold text-lg">No pending verification requests</p>
                                    <p className="text-slate-400 text-sm mt-1">All caught up!</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="sm:hidden space-y-4">
                                        {pendingUsers.map((u) => (
                                            <div key={u._id} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="h-14 w-14 rounded-2xl border border-sky-100 bg-sky-50 flex items-center justify-center text-sky-700 flex-shrink-0 shadow-sm">
                                                        {getRoleIcon(u.role, u.skillLevel)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-900 truncate text-lg">{u.name}</p>
                                                        <p className="text-sm text-slate-500 truncate">{u.email}</p>
                                                        <span className="inline-block mt-2 px-3 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-lg">
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
                                                    className="w-full bg-brand-navy hover:bg-sky-900 text-white font-semibold py-3 rounded-xl shadow-md shadow-slate-900/15 transition-all duration-200"
                                                >
                                                    Review Application
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden overflow-x-auto rounded-2xl border border-sky-100 sm:block">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-sky-50/70">
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
                                                    <tr key={u._id} className="transition-colors hover:bg-sky-50/70">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-11 w-11 rounded-xl border border-sky-100 bg-sky-50 flex items-center justify-center text-sky-700 shadow-sm">
                                                                    {getRoleIcon(u.role, u.skillLevel)}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-slate-900">{u.name}</div>
                                                                    <div className="text-sm text-slate-500">{u.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-100 text-sky-800 capitalize">
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
                                                                className="bg-brand-navy hover:bg-sky-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-slate-900/15 transition-all duration-200"
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
                            <SectionHeading icon={UserGroupIcon} title="User management" description="Search accounts and manage verification status." tone="sky" />
                            <div className="mb-6 flex flex-col flex-wrap gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 sm:flex-row">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="flex-1 sm:flex-none sm:w-64 border border-slate-200/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white shadow-sm"
                                    value={userFilters.search}
                                    onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                />
                                <select
                                    className="border border-slate-200/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-400 bg-white shadow-sm"
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
                                    className="border border-slate-200/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-400 bg-white shadow-sm"
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
                                    <div key={u._id} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 truncate text-lg">{u.name}</p>
                                                <p className="text-sm text-slate-500 truncate">{u.email}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs font-semibold text-slate-500 capitalize">{u.role}</span>
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${u.verified ? 'border border-lime-200 bg-lime-100 text-lime-800' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
                                                        {u.verified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </div>
                                            </div>
                                            {!u.verified ? (
                                                <button
                                                    onClick={() => handleUserUpdate(u._id, { verified: true, status: 'approved' })}
                                                    className="ml-3 px-4 py-2 bg-lime-600 text-white font-semibold rounded-xl shadow-md shadow-lime-900/10 text-sm"
                                                >
                                                    Verify
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUserUpdate(u._id, { verified: false })}
                                                    className="ml-3 px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl shadow-md shadow-rose-900/10 text-sm"
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden overflow-x-auto rounded-2xl border border-sky-100 sm:block">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-sky-50/70">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {users.map((u) => (
                                            <tr key={u._id} className="transition-colors hover:bg-sky-50/70">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-slate-900">{u.name}</div>
                                                    <div className="text-sm text-slate-500">{u.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 capitalize">
                                                    {u.role}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${u.verified ? 'border border-lime-200 bg-lime-100 text-lime-800' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
                                                        {u.verified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {!u.verified ? (
                                                        <button
                                                            onClick={() => handleUserUpdate(u._id, { verified: true, status: 'approved' })}
                                                            className="px-4 py-2 bg-lime-600 text-white font-semibold rounded-xl shadow-md shadow-lime-900/10 text-sm mr-3 hover:bg-lime-700 transition-all"
                                                        >
                                                            Verify
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUserUpdate(u._id, { verified: false })}
                                                            className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl shadow-md shadow-rose-900/10 text-sm mr-3 hover:bg-rose-700 transition-all"
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
                            <SectionHeading icon={CalendarDaysIcon} title="Bookings" description="Monitor court reservations and booking status." tone="sky" />
                            <div className="overflow-x-auto rounded-2xl border border-sky-100">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-sky-50/70">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Court</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {bookings.map((booking) => (
                                            <tr key={booking._id} className="transition-colors hover:bg-sky-50/70">
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
                                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${booking.status === 'confirmed' ? 'border border-lime-200 bg-lime-100 text-lime-800' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
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
                            <SectionHeading icon={TrophyIcon} title="Tournaments" description="Review competitions and remove invalid events." tone="navy" />
                            <div className="overflow-x-auto rounded-2xl border border-sky-100">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-sky-50/70">
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
                                            <tr key={t._id} className="transition-colors hover:bg-sky-50/70">
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
                                                    <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${t.status === 'registration_open' ? 'border-lime-200 bg-lime-100 text-lime-800' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button onClick={() => handleDeleteTournament(t._id)} className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl shadow-md shadow-rose-900/10 text-sm hover:bg-rose-700 transition-all">Delete</button>
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
                            <SectionHeading icon={BuildingOffice2Icon} title="Courts" description="Review venues, owners, pricing, and availability records." tone="lime" />
                            <div className="overflow-x-auto rounded-2xl border border-sky-100">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-sky-50/70">
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
                                            <tr key={court._id} className="transition-colors hover:bg-sky-50/70">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                    {court.name}
                                                    <div className="text-xs text-slate-500">{court.surfaceType}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {court.owner?.name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {court.location?.area || court.location?.city}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    Rs. {court.pricePerHour}/hr
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button onClick={() => handleDeleteCourt(court._id)} className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl shadow-md shadow-rose-900/10 text-sm hover:bg-rose-700 transition-all">Delete</button>
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
                            <div className="px-6 sm:px-8 py-5 bg-brand-navy flex items-center justify-between">
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
                                <div className="flex flex-col sm:flex-row items-start gap-5 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                                    <div className="h-16 w-16 rounded-2xl border border-sky-100 bg-sky-50 flex items-center justify-center text-sky-700 flex-shrink-0 shadow-sm">
                                        {getRoleIcon(selectedUser.role, selectedUser.skillLevel)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h4>
                                        <p className="text-slate-600 font-medium">{selectedUser.email}</p>
                                        <span className="mt-2 inline-block px-4 py-1.5 bg-sky-100 text-sky-800 text-sm font-bold rounded-lg">
                                            {getRoleLabel(selectedUser.role, selectedUser.skillLevel)}
                                        </span>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <MapPinIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">City</p>
                                            <p className="font-bold text-slate-900 truncate">{selectedUser.area || selectedUser.city || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <PhoneIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                                            <p className="font-bold text-slate-900 truncate">{selectedUser.phone || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <ClockIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered</p>
                                            <p className="font-bold text-slate-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {selectedUser.rank && (
                                        <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60">
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
                                        <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60">
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
                                    <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Achievements</p>
                                        <ul className="text-sm text-slate-700 space-y-2">
                                            {selectedUser.achievements.map((a, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="mt-0.5 text-sky-500">•</span>
                                                    <span>{a}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Verification Document */}
                                {selectedUser.verificationDocument && (
                                    <div className="p-5 bg-sky-50 rounded-2xl border border-sky-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                                <DocumentTextIcon className="h-6 w-6 text-sky-700" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-brand-navy">Verification Document</p>
                                                <p className="text-sm text-sky-700 truncate">{selectedUser.verificationDocument.split('/').pop()}</p>
                                            </div>
                                            <div className="flex gap-2 mt-3 sm:mt-0">
                                                {isImageFile(selectedUser.verificationDocument) ? (
                                                    <button
                                                        onClick={() => setShowDocumentModal(true)}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-900/10 hover:bg-sky-700 transition-all"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        View
                                                    </button>
                                                ) : null}
                                                <a
                                                    href={getDocumentUrl(selectedUser.verificationDocument)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-sky-700 border border-sky-300 rounded-xl text-sm font-bold hover:bg-sky-100 transition-colors"
                                                >
                                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                                    Open
                                                </a>
                                            </div>

                                            {/* Image Preview */}
                                            {isImageFile(selectedUser.verificationDocument) && (
                                                <div className="mt-5 border border-slate-200/60 rounded-2xl overflow-hidden bg-white shadow-sm">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider p-3 bg-sky-50/70 border-b border-slate-200/60">Document Preview:</p>
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
                                                                        e.target.alt = 'Failed to load verification document';
                                                                        e.target.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100px;background:#fee2e2;color:#dc2626;font-size:14px;';
                                                                        e.target.outerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100px;background:#fee2e2;color:#dc2626;font-size:14px;border-radius:8px;">Failed to load image. Try the Open button above.</div>';
                                                                    }}
                                                                />
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}

                                            {/* PDF Preview note */}
                                            {selectedUser.verificationDocument && !isImageFile(selectedUser.verificationDocument) && (
                                                <div className="mt-5 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-center text-sm text-slate-600">
                                                    This is a PDF document. Use the Open button above to view it.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!selectedUser.verificationDocument && (
                                    <div className="rounded-2xl border border-lime-200 bg-lime-50 p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-lime-400 text-brand-navy">
                                                <DocumentIcon className="h-5 w-5" />
                                            </div>
                                            <p className="font-bold text-brand-navy">No verification document uploaded</p>
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
                                        className="w-full p-4 border border-slate-200/60 rounded-2xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 resize-none bg-white shadow-sm"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 sm:px-8 py-5 bg-sky-50/70 border-t border-slate-200/60 flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="w-full sm:w-auto px-5 py-3 text-slate-700 bg-white border border-slate-200/60 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectUser}
                                    className="w-full sm:w-auto px-5 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-md shadow-rose-900/10 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                                    disabled={actionLoading}
                                >
                                    <XCircleIcon className="h-5 w-5" />
                                    Reject
                                </button>
                                <button
                                    onClick={handleApproveUser}
                                    className="w-full sm:w-auto px-5 py-3 bg-lime-600 text-white rounded-xl font-bold shadow-md shadow-lime-900/10 hover:bg-lime-700 transition-all flex items-center justify-center gap-2"
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
                    <div className="flex items-center justify-between border-b border-white/10 bg-brand-navy-deep px-6 py-4">
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

const SectionHeading = ({ icon, title, description, tone = 'sky' }) => {
    const tones = {
        navy: 'bg-brand-navy text-white',
        sky: 'bg-brand-sky text-brand-navy',
        lime: 'bg-lime-400 text-brand-navy',
    };

    return (
        <div className="mb-6 flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${tones[tone] || tones.sky}`}>
                {createElement(icon, { className: 'h-6 w-6' })}
            </div>
            <div>
                <h2 className="text-xl font-black tracking-[-0.025em] text-brand-navy sm:text-2xl">{title}</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, subtext, tone = 'sky', icon, highlight, className = '' }) => {
    const tones = {
        navy: {
            card: 'border-sky-100 bg-gradient-to-br from-white to-sky-50/60',
            icon: 'bg-brand-navy text-white',
            value: 'text-brand-navy',
        },
        sky: {
            card: 'border-sky-100 bg-gradient-to-br from-white to-sky-50',
            icon: 'bg-brand-sky text-brand-navy',
            value: 'text-sky-700',
        },
        lime: {
            card: 'border-lime-100 bg-gradient-to-br from-white to-lime-50/70',
            icon: 'bg-lime-400 text-brand-navy',
            value: 'text-lime-700',
        },
    };
    const palette = tones[tone] || tones.sky;
    
    return (
        <div className={`rounded-2xl border p-4 shadow-[0_16px_35px_-28px_rgba(3,20,47,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-26px_rgba(3,20,47,0.45)] sm:p-5 ${palette.card} ${highlight ? 'ring-2 ring-lime-300 ring-offset-2' : ''} ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${palette.icon}`}>
                    {createElement(icon, { className: 'h-5 w-5' })}
                </div>
                {highlight && <span className="rounded-full bg-lime-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-lime-800">Action</span>}
            </div>
            <dt className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{title}</dt>
            <dd className={`mt-1 text-2xl font-black tracking-[-0.035em] sm:text-3xl ${palette.value}`}>{value}</dd>
            <p className="mt-1 text-xs font-semibold text-slate-500">{subtext}</p>
        </div>
    );
};

export default AdminDashboard;
