import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClockIcon, ArrowRightOnRectangleIcon, EnvelopeIcon, UserIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';

const PendingVerification = () => {
    const { user, logout } = useAuth();

    const getStatusConfig = () => {
        switch (user?.status) {
            case 'waiting_for_approval':
                return {
                    icon: ClockIcon,
                    iconBg: 'bg-amber-50',
                    iconColor: 'text-amber-500',
                    title: 'Verification In Progress',
                    message: 'Your profile is under review by our admin team. You will be notified via email once approved.',
                    statusLabel: 'Waiting for Approval',
                    statusColor: 'bg-amber-100 text-amber-700'
                };
            case 'rejected':
                return {
                    icon: XCircleIcon,
                    iconBg: 'bg-rose-50',
                    iconColor: 'text-rose-500',
                    title: 'Verification Rejected',
                    message: 'Unfortunately, your verification request was not approved. Please review the reason below and contact support if needed.',
                    statusLabel: 'Rejected',
                    statusColor: 'bg-rose-100 text-rose-700'
                };
            case 'pending':
                return {
                    icon: ClockIcon,
                    iconBg: 'bg-blue-50',
                    iconColor: 'text-blue-500',
                    title: 'Profile Setup Required',
                    message: 'Please complete your profile setup to proceed with the verification process.',
                    statusLabel: 'Pending Setup',
                    statusColor: 'bg-blue-100 text-blue-700'
                };
            default:
                return {
                    icon: ClockIcon,
                    iconBg: 'bg-slate-50',
                    iconColor: 'text-slate-500',
                    title: 'Verification Status',
                    message: 'Your account status is being processed.',
                    statusLabel: user?.status || 'Unknown',
                    statusColor: 'bg-slate-100 text-slate-700'
                };
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 p-10 text-center"
            >
                {/* Icon */}
                <div className={`mx-auto h-20 w-20 rounded-[1.5rem] ${config.iconBg} flex items-center justify-center mb-8`}>
                    <StatusIcon className={`h-10 w-10 ${config.iconColor}`} />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-black text-slate-900 mb-3">
                    {config.title}
                </h1>
                <p className="text-slate-500 font-medium mb-4 leading-relaxed">
                    {config.message}
                </p>

                {/* Status Badge */}
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${config.statusColor} mb-8`}>
                    {config.statusLabel}
                </div>

                {/* User Info */}
                <div className="bg-slate-50 rounded-2xl p-6 mb-8 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                            <EnvelopeIcon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email</p>
                            <p className="text-sm font-semibold text-slate-800">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Role</p>
                            <p className="text-sm font-semibold text-slate-800 capitalize">
                                {user?.role || 'Not Selected'} {user?.skillLevel === 'professional' && '(Professional)'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rejection Reason */}
                {user?.status === 'rejected' && user?.rejectionReason && (
                    <div className="bg-rose-50 rounded-2xl p-6 mb-8 text-left border border-rose-100">
                        <p className="text-xs font-bold uppercase text-rose-500 tracking-wider mb-2">Rejection Reason</p>
                        <p className="text-sm font-medium text-rose-700">{user.rejectionReason}</p>
                    </div>
                )}

                {/* Pending Setup Action */}
                {user?.status === 'pending' && !user?.role && (
                    <div className="mb-8">
                        <Link to="/role-selection">
                            <Button
                                fullWidth
                                className="h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                            >
                                Complete Profile Setup
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <Button
                        onClick={logout}
                        fullWidth
                        className="h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                        Sign Out
                    </Button>
                    <Link to="/" className="block">
                        <Button
                            variant="outline"
                            fullWidth
                            className="h-12 font-bold border-slate-200 text-slate-700 rounded-xl"
                        >
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Help */}
                <p className="mt-8 text-xs text-slate-400">
                    Need help? Contact us at{' '}
                    <a href="mailto:support@sportsphere.pk" className="text-indigo-600 hover:underline">
                        support@sportsphere.pk
                    </a>
                </p>
            </motion.div>
        </div>
    );
};

export default PendingVerification;
