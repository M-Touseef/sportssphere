import { CheckCircleIcon, XCircleIcon, ShieldCheckIcon, UserPlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import StatCard from '../../components/ui/StatCard';
import axiosInstance from '../../services/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { cld, getPublicIdFromUrl } from '../../utils/cloudinary';

export default function AdminDashboard() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [logs, setLogs] = useState([]); // In a real app, fetch execution logs
    const [stats, setStats] = useState({
        pending: 0,
        total: 0,
        issues: 0,
        revenue: '0'
    });
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            // Fetch users needing verification
            const usersRes = await axiosInstance.get('/admin/users?verified=false');
            setPendingUsers(usersRes.data.data);

            // Fetch overall stats (assuming /admin/stats exists as per controller)
            const statsRes = await axiosInstance.get('/admin/stats');
            const s = statsRes.data.data;

            setStats({
                pending: usersRes.data.data.length,
                total: s.users.total,
                issues: 0, // Placeholder
                revenue: `$${s.bookings.revenue}`
            });

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error('Failed to load dashboard data');
            setIsLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await axiosInstance.put(`/admin/users/${userId}`, { verified: true });
            toast.success('User approved successfully');
            fetchDashboardData(); // Refresh list
        } catch (error) {
            console.error('Error approving user:', error);
            toast.error('Failed to approve user');
        }
    };

    const handleRejectClick = (user) => {
        setSelectedUser(user);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const confirmReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            // rejection logic: Keep verified=false, but update reason. 
            // Or maybe verified=false is enough, but effectively we are "rejecting".
            // If the requirement is just "give reason", we store the reason.
            await axiosInstance.put(`/admin/users/${selectedUser._id}`, {
                verified: false,
                rejectionReason: rejectionReason
            });
            toast.success('User rejected and notified');
            setIsRejectModalOpen(false);
            fetchDashboardData();
        } catch (error) {
            console.error('Error rejecting user:', error);
            toast.error('Failed to reject user');
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

    return (
        <div className="space-y-12 animate-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 relative">
            {/* Header */}
            <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
                    Admin Dashboard
                </h1>
                <p className="mt-3 sm:mt-4 text-base sm:text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                    System operations and strategic overview.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Pending Approvals"
                    value={stats.pending}
                    icon={ShieldCheckIcon}
                    color="yellow"
                />
                <StatCard
                    title="Total Users"
                    value={stats.total}
                    icon={UserPlusIcon}
                    color="indigo"
                />
                <StatCard
                    title="System Issues"
                    value={stats.issues}
                    icon={ExclamationTriangleIcon}
                    color="green"
                />
                <StatCard
                    title="Revenue"
                    value={stats.revenue}
                    icon={CheckCircleIcon}
                    color="blue"
                />
            </div>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-start">
                {/* Pending Verifications */}
                <div className="flex flex-col space-y-4">
                    <div className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden flex flex-col min-h-[400px]">
                        <div className="px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <ShieldCheckIcon className="h-5 w-5" />
                                </div>
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">Pending Verifications</h2>
                            </div>
                        </div>
                        <div className="flex-1 p-4 sm:p-8">
                            <ul role="list" className="divide-y divide-gray-100">
                                {pendingUsers.map((user) => (
                                    <li key={user._id} className="relative flex flex-col sm:flex-row justify-between gap-4 p-5 sm:p-6 bg-slate-50/50 hover:bg-white rounded-2xl sm:rounded-[1.5rem] border border-transparent hover:border-slate-100 hover:shadow-lg transition-all duration-300">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg border ${user.role === 'coach' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-lg font-extrabold text-slate-900 mb-0.5 break-words">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium mb-3 break-words">{user.email}</p>

                                            {user.verificationDocument && (
                                                <a
                                                    href={user.verificationDocument}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm transition-all"
                                                >
                                                    <ShieldCheckIcon className="h-3.5 w-3.5" />
                                                    Review Credentials
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex sm:flex-col items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleApprove(user._id)}
                                                className="flex-1 sm:w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                title="Approve"
                                            >
                                                <CheckCircleIcon className="h-6 w-6" />
                                            </button>
                                            <button
                                                onClick={() => handleRejectClick(user)}
                                                className="flex-1 sm:w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                                title="Reject"
                                            >
                                                <XCircleIcon className="h-6 w-6" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {pendingUsers.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                                        <p className="text-slate-500 text-sm font-medium">No tactical verifications pending.</p>
                                    </div>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="flex flex-col space-y-4">
                    <div className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden flex flex-col min-h-[400px]">
                        <div className="px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                    <ExclamationTriangleIcon className="h-5 w-5" />
                                </div>
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">Recent Activity</h2>
                            </div>
                        </div>
                        <div className="flex-1 p-10 flex items-center justify-center bg-slate-50/30">
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Logs Synchronizing</p>
                                <p className="text-xs text-slate-400 font-medium mt-1">Operational history will appear in the system terminal.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rejection Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRejectModalOpen(false)} />
                    <div className="relative bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden p-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Reject Verification</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6">
                            Specify the operational deficiency for {selectedUser?.name}.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none resize-none mb-6"
                            rows={4}
                            placeholder="Rejection reason..."
                        />
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReject}
                                className="flex-1 h-12 rounded-xl bg-rose-600 text-white font-bold shadow-xl shadow-rose-100 transition-all hover:bg-rose-700"
                            >
                                Execute Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
