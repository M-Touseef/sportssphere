import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AcademicCapIcon,
    ArrowRightIcon,
    CalendarDaysIcon,
    CheckBadgeIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ClockIcon,
    InboxIcon,
    MapPinIcon,
    SparklesIcon,
    UserGroupIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import sparringService from '../../services/sparringService';
import sessionService from '../../services/sessionService';
import * as paymentService from '../../services/paymentService';
import { expandCoachingSessionsForCoach } from '../../utils/coachingSessionRequests';
import { formatCoachingHours, sumCoachingHours } from '../../utils/timeFormat';

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (value, options = {}) => {
    if (!value) return 'Date to be confirmed';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date to be confirmed';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options
    });
};

const formatStatus = (status = '') => status.replace(/_/g, ' ');

const MetricCard = ({ icon, label, value, detail, accent }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-200">
                {createElement(icon, { className: 'h-5 w-5' })}
            </div>
        </div>
    </div>
);

const QuickLink = ({ icon, title, description, href, tone = 'sky' }) => {
    const tones = {
        sky: 'bg-sky-50 text-sky-700 group-hover:bg-sky-100',
        lime: 'bg-lime-50 text-lime-700 group-hover:bg-lime-100',
        amber: 'bg-amber-50 text-amber-700 group-hover:bg-amber-100'
    };

    return (
        <Link to={href} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${tones[tone]}`}>
                {createElement(icon, { className: 'h-5 w-5' })}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{description}</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
        </Link>
    );
};

const CoachDashboard = () => {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const showErrorRef = useRef(showError);
    showErrorRef.current = showError;
    const [sessions, setSessions] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingFeeId, setPayingFeeId] = useState(null);
    const [processingRequestId, setProcessingRequestId] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [sparringResult, sessionResult] = await Promise.all([
                sparringService.getIncomingRequests(),
                sessionService.getCoachSessions()
            ]);
            const coachingSessions = sessionResult?.data || sessionResult || [];
            const allRequests = [
                ...(sparringResult?.data || sparringResult || []),
                ...expandCoachingSessionsForCoach(coachingSessions)
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setSessions(Array.isArray(coachingSessions) ? coachingSessions : []);
            setRequests(allRequests);
        } catch (error) {
            console.error('Error fetching coach dashboard:', error);
            showErrorRef.current('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const dashboard = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const uniqueStudents = new Set(
            sessions.flatMap(session => (session.students || []).map(student => (
                typeof student === 'object' ? student?._id : student
            )?.toString()).filter(Boolean))
        );
        const pendingRequests = requests.filter(request => request.status === 'PENDING_RESPONSE');
        const confirmedRequests = requests
            .filter(request => ['ACCEPTED', 'PAID & CONFIRMED', 'confirmed'].includes(request.status))
            .filter(request => {
                const date = new Date(request.availabilitySlot?.date);
                return !Number.isNaN(date.getTime()) && date >= today;
            })
            .sort((a, b) => new Date(a.availabilitySlot?.date) - new Date(b.availabilitySlot?.date));

        return {
            today,
            pendingRequests,
            confirmedRequests,
            nextSession: confirmedRequests[0],
            totalStudents: uniqueStudents.size,
            hoursCoached: sumCoachingHours(sessions)
        };
    }, [requests, sessions]);

    const handlePayFee = async (sessionId) => {
        try {
            setPayingFeeId(sessionId);
            const result = await paymentService.payCourtFee(sessionId);
            if (result?.completed) {
                success('Court fee recorded (demo payment).');
                await fetchDashboardData();
            }
        } catch (error) {
            console.error(error);
            showError(error?.response?.data?.error || 'Failed to complete court fee payment.');
        } finally {
            setPayingFeeId(null);
        }
    };

    const handleAction = async (request, action) => {
        try {
            setProcessingRequestId(request._id);
            if (request.type === 'COACHING_SESSION') {
                await (action === 'accept'
                    ? sessionService.confirmSession(request._id)
                    : sessionService.rejectSession(request._id));
            } else {
                await (action === 'accept'
                    ? sparringService.acceptRequest(request._id)
                    : sparringService.rejectRequest(request._id));
            }
            success(action === 'accept' ? 'Request accepted.' : 'Request rejected.');
            await fetchDashboardData();
        } catch (error) {
            console.error(error);
            showError(`Failed to ${action} request.`);
        } finally {
            setProcessingRequestId(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    const firstName = user?.name?.trim().split(/\s+/)[0] || 'Coach';
    const { today, pendingRequests, confirmedRequests, nextSession, totalStudents, hoursCoached } = dashboard;
    const nextSessionDays = nextSession
        ? Math.max(0, Math.ceil((new Date(nextSession.availabilitySlot?.date) - today) / DAY_MS))
        : null;

    return (
        <div className="mx-auto max-w-[1440px] space-y-6 pb-10">
            <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.20),transparent_32%),radial-gradient(circle_at_15%_90%,rgba(163,230,53,0.12),transparent_28%)]" />
                <div className="absolute right-8 top-0 h-32 w-32 rounded-full border border-white/10" />
                <div className="absolute right-20 top-12 h-32 w-32 rounded-full border border-white/5" />

                <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.65fr] lg:p-10">
                    <div className="flex flex-col justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                                    user?.verified
                                        ? 'border-lime-300/20 bg-lime-300/10 text-lime-200'
                                        : 'border-amber-300/20 bg-amber-300/10 text-amber-200'
                                }`}>
                                    <CheckBadgeIcon className="h-4 w-4" />
                                    {user?.verified ? 'Verified coach' : 'Coach workspace'}
                                </span>
                                {pendingRequests.length > 0 && (
                                    <Link to="/coach/requests" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-sky-100 transition hover:bg-white/15">
                                        {pendingRequests.length} request{pendingRequests.length === 1 ? '' : 's'} waiting
                                    </Link>
                                )}
                            </div>
                            <p className="mt-7 text-sm font-semibold text-sky-200">Welcome back, {firstName}</p>
                            <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                                Your coaching week, clearly organized.
                            </h1>
                            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                                Keep court reservations, athlete requests, and confirmed sessions moving from one focused workspace.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link to="/coach/schedule" className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-lime-200">
                                <CalendarDaysIcon className="h-5 w-5" /> Manage schedule
                            </Link>
                            <Link to="/coach/requests" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                                Review requests <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">Next session</p>
                                <p className="mt-1 text-xs text-slate-400">Your nearest confirmed commitment</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-200">
                                <CalendarDaysIcon className="h-5 w-5" />
                            </div>
                        </div>

                        {nextSession ? (
                            <div className="mt-7">
                                <p className="text-xs font-bold uppercase tracking-wider text-lime-200">
                                    {nextSession.type === 'COACHING_SESSION' ? 'Coaching session' : 'Sparring session'}
                                </p>
                                <h2 className="mt-2 text-xl font-extrabold leading-tight text-white">
                                    {nextSession.requester?.name || nextSession.students?.[0]?.name || 'Upcoming athlete session'}
                                </h2>
                                <div className="mt-5 space-y-2.5 text-sm text-slate-300">
                                    <p className="flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4 text-sky-300" /> {formatDate(nextSession.availabilitySlot?.date, { weekday: 'short' })}</p>
                                    <p className="flex items-center gap-2"><ClockIcon className="h-4 w-4 text-sky-300" /> {nextSession.availabilitySlot?.startTime || 'Time TBD'}{nextSession.availabilitySlot?.endTime ? ` - ${nextSession.availabilitySlot.endTime}` : ''}</p>
                                    <p className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-sky-300" /> {nextSession.availabilitySlot?.courtName || 'Court details pending'}</p>
                                </div>
                                <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
                                    <div>
                                        <p className="text-3xl font-black text-white">{nextSessionDays}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">day{nextSessionDays === 1 ? '' : 's'} away</p>
                                    </div>
                                    <Link to="/coach/requests" className="inline-flex items-center gap-1 text-sm font-bold text-sky-200 hover:text-white">
                                        View details <ChevronRightIcon className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
                                <p className="text-sm font-bold text-white">Your confirmed calendar is open</p>
                                <p className="mt-2 text-xs leading-5 text-slate-400">Reserve a court and publish coaching hours to start receiving session requests.</p>
                                <Link to="/coach/schedule" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-lime-200 hover:text-lime-100">
                                    Build your schedule <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={CheckBadgeIcon} label="Total sessions" value={sessions.length} detail="Coaching sessions recorded" accent="bg-sky-500" />
                <MetricCard icon={UserGroupIcon} label="Athletes coached" value={totalStudents} detail="Unique students reached" accent="bg-lime-400" />
                <MetricCard icon={ClockIcon} label="Hours coached" value={formatCoachingHours(hoursCoached)} detail="Time delivered across sessions" accent="bg-violet-500" />
                <MetricCard icon={InboxIcon} label="Needs response" value={pendingRequests.length} detail="Open athlete requests" accent="bg-amber-400" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
                <div className="space-y-6">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Athlete inbox</p>
                                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Requests needing a response</h2>
                                <p className="mt-1 text-sm text-slate-500">Make quick decisions without losing the schedule context.</p>
                            </div>
                            <Link to="/coach/requests" className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-sky-700">
                                All requests <ChevronRightIcon className="h-4 w-4" />
                            </Link>
                        </div>

                        {pendingRequests.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {pendingRequests.slice(0, 4).map((request, index) => {
                                    const isProcessing = processingRequestId === request._id;
                                    return (
                                        <article key={`${request._id}-${request.requester?._id || index}`} className="py-5">
                                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">Pending</span>
                                                        <span className="text-xs font-semibold text-slate-400">{formatDate(request.createdAt)}</span>
                                                    </div>
                                                    <h3 className="mt-3 text-lg font-extrabold text-slate-950">
                                                        {request.requester?.name || request.students?.[0]?.name || 'Athlete request'}
                                                    </h3>
                                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                                                        <span className="flex items-center gap-1.5"><CalendarDaysIcon className="h-4 w-4 text-sky-600" /> {formatDate(request.availabilitySlot?.date)}</span>
                                                        <span className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4 text-sky-600" /> {request.availabilitySlot?.startTime || 'TBD'}{request.availabilitySlot?.endTime ? ` - ${request.availabilitySlot.endTime}` : ''}</span>
                                                        <span className="flex items-center gap-1.5"><MapPinIcon className="h-4 w-4 text-sky-600" /> {request.availabilitySlot?.courtName || 'Court TBD'}</span>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                                                            <SparklesIcon className="h-3.5 w-3.5" /> {request.paymentPlan || 'Hourly'}
                                                        </span>
                                                        {request.type === 'COACHING_SESSION' && request.availabilitySlot?.courtFee > 0 && (
                                                            <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${
                                                                request.availabilitySlot?.courtPaymentStatus === 'paid'
                                                                    ? 'bg-lime-50 text-lime-800'
                                                                    : 'bg-rose-50 text-rose-700'
                                                            }`}>
                                                                Court PKR {request.availabilitySlot.courtFee}: {request.availabilitySlot?.courtPaymentStatus || 'unpaid'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 lg:justify-end">
                                                    {request.type === 'COACHING_SESSION' && request.availabilitySlot?.courtFee > 0 && request.availabilitySlot?.courtPaymentStatus !== 'paid' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePayFee(request._id)}
                                                            disabled={payingFeeId === request._id}
                                                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:opacity-50"
                                                        >
                                                            {payingFeeId === request._id ? 'Processing...' : 'Pay court fee'}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(request, 'reject')}
                                                        disabled={isProcessing}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                                                    >
                                                        <XCircleIcon className="h-4 w-4" /> Reject
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(request, 'accept')}
                                                        disabled={isProcessing}
                                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-800 disabled:opacity-50"
                                                    >
                                                        <CheckCircleIcon className="h-4 w-4" /> {isProcessing ? 'Working...' : 'Accept'}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200"><InboxIcon className="h-6 w-6" /></div>
                                <h3 className="mt-4 text-sm font-bold text-slate-900">Inbox cleared</h3>
                                <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">New coaching and sparring requests will appear here.</p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-700">Confirmed calendar</p>
                                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Upcoming athlete sessions</h2>
                            </div>
                            <Link to="/coach/schedule" className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-sky-700">
                                Manage schedule <ChevronRightIcon className="h-4 w-4" />
                            </Link>
                        </div>

                        {confirmedRequests.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {confirmedRequests.slice(0, 4).map((request, index) => (
                                    <div key={`${request._id}-confirmed-${index}`} className="grid gap-4 py-5 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
                                        <div className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-2xl bg-slate-950 text-white">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-300">
                                                {formatDate(request.availabilitySlot?.date, { year: undefined }).split(' ')[0]}
                                            </span>
                                            <span className="text-2xl font-black leading-none">{new Date(request.availabilitySlot?.date).getDate()}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="truncate font-extrabold text-slate-950">{request.requester?.name || request.students?.[0]?.name || 'Athlete session'}</h3>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                                                <span className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4 text-sky-600" /> {request.availabilitySlot?.startTime || 'TBD'}{request.availabilitySlot?.endTime ? ` - ${request.availabilitySlot.endTime}` : ''}</span>
                                                <span className="flex items-center gap-1.5"><MapPinIcon className="h-4 w-4 text-sky-600" /> {request.availabilitySlot?.courtName || 'Court TBD'}</span>
                                            </div>
                                        </div>
                                        <span className="w-fit rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-lime-800">{formatStatus(request.status)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-sm text-slate-500">No confirmed upcoming sessions yet.</div>
                        )}
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">Coach toolkit</p>
                        <h2 className="mt-2 text-xl font-black">Keep the next action close.</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">Move from planning to athlete follow-up without digging through menus.</p>
                        <div className="mt-6 space-y-3">
                            <QuickLink icon={CalendarDaysIcon} title="Schedule & courts" description="Reserve venues and publish hours" href="/coach/schedule" tone="lime" />
                            <QuickLink icon={InboxIcon} title="Training requests" description="Accept, reject, and review athletes" href="/coach/requests" tone="sky" />
                            <QuickLink icon={AcademicCapIcon} title="Public coach profile" description="Update rates, bio, and expertise" href="/coach/profile" tone="amber" />
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Current pulse</p>
                                <h2 className="mt-1 text-lg font-black text-slate-950">Coaching readiness</h2>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-50 text-lime-700"><CheckBadgeIcon className="h-5 w-5" /></div>
                        </div>
                        <div className="mt-5 space-y-4 text-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Requests waiting</span><strong className="text-slate-950">{pendingRequests.length}</strong></div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Confirmed ahead</span><strong className="text-slate-950">{confirmedRequests.length}</strong></div>
                            <div className="flex items-center justify-between"><span className="text-slate-500">Profile status</span><strong className={user?.verified ? 'text-lime-700' : 'text-amber-700'}>{user?.verified ? 'Verified' : 'Review details'}</strong></div>
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
};

export default CoachDashboard;
