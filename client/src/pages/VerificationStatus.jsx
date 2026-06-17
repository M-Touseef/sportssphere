import { Navigate, Link } from 'react-router-dom';
import {
    ArrowRightOnRectangleIcon,
    ClockIcon,
    EnvelopeIcon,
    ShieldCheckIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function VerificationStatus() {
    const { user, logout } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.verified) {
        return <Navigate to="/app" replace />;
    }

    const isRejected = Boolean(user.rejectionReason);
    const Icon = isRejected ? XCircleIcon : ClockIcon;

    return (
        <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-4xl items-center justify-center px-4 py-10">
            <section
                className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            >
                <div className="bg-slate-950 px-6 py-8 text-white sm:px-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                                isRejected ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
                            }`}>
                                <Icon className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200">
                                    Verification status
                                </p>
                                <h1 className="mt-2 text-3xl font-black tracking-tight">
                                    {isRejected ? 'Verification rejected' : 'Verification pending'}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-300">
                                    {isRejected
                                        ? 'Your verification request needs attention before the account can be approved.'
                                        : 'Your account is under admin review. Most requests are reviewed within 24 to 48 hours.'}
                                </p>
                            </div>
                        </div>
                        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                            isRejected
                                ? 'border-rose-300/40 bg-rose-400/15 text-rose-100'
                                : 'border-amber-300/40 bg-amber-300/15 text-amber-100'
                        }`}>
                            <ShieldCheckIcon className="h-4 w-4" />
                            {isRejected ? 'Action needed' : 'In review'}
                        </span>
                    </div>
                </div>

                <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_0.85fr]">
                    <div className="space-y-4">
                        {isRejected ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600">
                                    Rejection reason
                                </p>
                                <p className="mt-3 text-sm font-semibold leading-6 text-rose-900">
                                    {user.rejectionReason}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                                    What happens next
                                </p>
                                <p className="mt-3 text-sm font-semibold leading-6 text-amber-950">
                                    You will be able to access the dashboard once an administrator approves your account.
                                </p>
                            </div>
                        )}

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                Account
                            </p>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sky-700 ring-1 ring-slate-200">
                                    <EnvelopeIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">{user.email}</p>
                                    <p className="mt-0.5 text-xs font-semibold capitalize text-slate-500">
                                        {user.role || 'Account'} {user.skillLevel === 'professional' ? 'professional' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-black text-slate-950">Need help?</h2>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                            Contact support if you believe this status is incorrect or you need help updating verification documents.
                        </p>
                        <div className="mt-6 space-y-3">
                            <Button
                                onClick={logout}
                                fullWidth
                                className="h-12 bg-slate-950 text-white hover:bg-sky-900"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                Sign out
                            </Button>
                            <Link to="/support" className="block">
                                <Button
                                    variant="outline"
                                    fullWidth
                                    className="h-12 border-slate-200 text-slate-700"
                                >
                                    Contact support
                                </Button>
                            </Link>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}
