import { useState, useEffect } from 'react';
import { CalendarDaysIcon, ClockIcon, UserIcon, CheckCircleIcon, XCircleIcon, SparklesIcon, MapPinIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import StatCard from '../../components/ui/StatCard';
import { useAuth } from '../../context/AuthContext';
import sparringService from '../../services/sparringService';
import sessionService from '../../services/sessionService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import * as paymentService from '../../services/paymentService';
import { sumCoachingHours, formatCoachingHours } from '../../utils/timeFormat';

const CoachDashboard = () => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalStudents: 0,
        hoursCoached: 0
    });
    const [requests, setRequests] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingFeeId, setPayingFeeId] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [reqs, sessionsRes] = await Promise.all([
                sparringService.getIncomingRequests(),
                sessionService.getCoachSessions()
            ]);

            const coachingSessionsList = sessionsRes?.data || sessionsRes || [];

            // Normalize Coaching Sessions to match Request structure
            const coachingRequests = coachingSessionsList.map(session => ({
                _id: session._id,
                type: 'COACHING_SESSION',
                requester: session.student,
                availabilitySlot: {
                    date: session.date,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    courtName: session.court?.name,
                    courtFee: session.courtFee,
                    courtPaymentStatus: session.courtPaymentStatus
                },
                students: session.students || [],
                maxStudents: session.maxStudents || 1,
                message: session.notes || 'Coaching Session Booking',
                paymentPlan: session.planType,
                responseDeadline: session.responseDeadline,
                status: session.status === 'pending' ? 'PENDING_RESPONSE' :
                    session.status === 'pending_payment' ? 'ACCEPTED' :
                        session.status === 'confirmed' ? 'ACCEPTED' :
                            session.status === 'cancelled' ? 'REJECTED' : session.status,
                createdAt: session.createdAt
            }));

            // Combine Sparring Requests and Coaching Sessions
            const allRequests = [
                ...(reqs.data || reqs || []),
                ...coachingRequests
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setRequests(allRequests);

            const uniqueStudents = new Set(
                coachingSessionsList.flatMap((s) =>
                    (s.students || []).map((st) => (typeof st === 'object' ? st._id : st)?.toString())
                )
            );

            setStats({
                totalSessions: coachingSessionsList.length,
                totalStudents: uniqueStudents.size,
                hoursCoached: sumCoachingHours(coachingSessionsList)
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // toastError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handlePayFee = async (sessionId) => {
        try {
            setPayingFeeId(sessionId);
            await paymentService.payCourtFee(sessionId);
        } catch (error) {
            console.error(error);
            toastError('Failed to initiate court fee payment.');
            setPayingFeeId(null);
        }
    };

    const handleAction = async (request, action) => {
        try {
            if (request.type === 'COACHING_SESSION') {
                if (action === 'accept') {
                    await sessionService.confirmSession(request._id);
                    success('Session confirmed!');
                } else {
                    await sessionService.rejectSession(request._id);
                    success('Session rejected.');
                }
            } else {
                // Sparring Request
                if (action === 'accept') {
                    await sparringService.acceptRequest(request._id);
                    success('Request accepted! Waiting for payment.');
                } else {
                    await sparringService.rejectRequest(request._id);
                    success('Request rejected.');
                }
            }
            fetchDashboardData(); // Refresh list
        } catch (error) {
            console.error(error);
            toastError(`Failed to ${action} request.`);
        }
    };

    return (
        <div className="space-y-12 animate-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
                        Coach Dashboard
                    </h1>
                    <p className="mt-3 sm:mt-4 text-base sm:text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                        Manage your sessions and track your performance.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link to="/coach/schedule">
                        <Button variant="primary" className="h-14 px-8 rounded-2xl shadow-xl shadow-indigo-100 font-bold">
                            Manage Availability
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total Sessions"
                    value={stats.totalSessions}
                    icon={CheckBadgeIcon}
                    color="blue"
                />
                <StatCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={UserIcon}
                    color="blue"
                />
                <StatCard
                    title="Hours Coached"
                    value={formatCoachingHours(stats.hoursCoached)}
                    icon={ClockIcon}
                    color="green"
                />
            </div>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-start">
                {/* Incoming Requests */}
                <div className="flex flex-col space-y-4">
                    <div className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden flex flex-col min-h-[400px]">
                        <div className="px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <ClockIcon className="h-5 w-5" />
                                </div>
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">Incoming Requests</h2>
                            </div>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-lg border border-indigo-100">
                                {requests.filter(r => r.status === 'PENDING_RESPONSE').length} Pending
                            </span>
                        </div>
                        <div className="flex-1 p-4 sm:p-6 lg:p-8">
                            {requests.length > 0 ? (
                                <ul role="list" className="space-y-4 lg:space-y-5">
                                    {requests.map((request) => (
                                        <li key={request._id} className="relative p-4 sm:p-5 lg:p-6 bg-slate-50/50 hover:bg-white rounded-2xl lg:rounded-3xl border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                                            <div className="flex flex-col sm:flex-row justify-between gap-4 lg:gap-6">
                                                {/* Main Content */}
                                                <div className="flex-1 min-w-0 space-y-3 lg:space-y-4">
                                                    {/* Status & Date Row */}
                                                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                                                        <span className={`px-3 lg:px-4 py-1.5 text-[10px] lg:text-xs font-black uppercase rounded-lg lg:rounded-xl border ${request.status === 'PENDING_RESPONSE'
                                                            ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            request.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                'bg-slate-100 text-slate-500 border-slate-200'
                                                            }`}>
                                                            {request.status.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-xs lg:text-sm font-bold text-slate-300">
                                                            {new Date(request.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    {/* Name */}
                                                    <p className="text-lg lg:text-xl font-extrabold text-slate-900 leading-tight">
                                                        {request.type === 'COACHING_SESSION'
                                                            ? (request.students?.[0]?.name || 'Student') + (request.students?.length > 1 ? ` + ${request.students.length - 1} more` : '')
                                                            : (request.requester?.name || 'Requester')}
                                                    </p>

                                                    {/* Time & Location Info */}
                                                    <div className="flex flex-wrap items-center gap-3 lg:gap-5 text-xs lg:text-sm font-semibold text-slate-500">
                                                        <div className="flex items-center gap-2">
                                                            <ClockIcon className="h-4 w-4 lg:h-5 lg:w-5 text-indigo-500" />
                                                            <span>{request.availabilitySlot?.startTime} - {request.availabilitySlot?.endTime}</span>
                                                        </div>
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 hidden sm:block" />
                                                        <div className="flex items-center gap-2">
                                                            <CalendarDaysIcon className="h-4 w-4 lg:h-5 lg:w-5 text-slate-400" />
                                                            <span>{new Date(request.availabilitySlot?.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 hidden sm:block" />
                                                        <div className="flex items-center gap-2">
                                                            <MapPinIcon className="h-4 w-4 lg:h-5 lg:w-5 text-indigo-500" />
                                                            <span>{request.availabilitySlot?.courtName || 'Assigned Court'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Message */}
                                                    {request.message && (
                                                        <p className="text-sm lg:text-base text-slate-500 font-medium bg-white border border-slate-100 p-3 lg:p-4 rounded-xl lg:rounded-2xl italic">
                                                            "{request.message}"
                                                        </p>
                                                    )}

                                                    {/* Tags Row */}
                                                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                                                        <span className="text-[10px] lg:text-xs font-black text-indigo-600 uppercase tracking-wide flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg lg:rounded-xl">
                                                            <SparklesIcon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                                            {request.paymentPlan || 'Hourly'}
                                                        </span>
                                                        {request.type === 'COACHING_SESSION' && request.availabilitySlot?.courtFee > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-3 py-1.5 text-[10px] lg:text-xs font-bold uppercase rounded-lg lg:rounded-xl border ${request.availabilitySlot?.courtPaymentStatus === 'paid'
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                    : 'bg-rose-50 text-rose-600 border-rose-100'
                                                                    }`}>
                                                                    Court Fee: Rs. {request.availabilitySlot?.courtFee}
                                                                </span>
                                                                {request.availabilitySlot?.courtPaymentStatus !== 'paid' && (
                                                                    <button
                                                                        onClick={() => handlePayFee(request._id)}
                                                                        disabled={payingFeeId === request._id}
                                                                        className={`text-[10px] lg:text-xs font-black text-white px-3 lg:px-4 py-1.5 rounded-lg lg:rounded-xl transition-all uppercase shadow-md ${payingFeeId === request._id
                                                                            ? 'bg-indigo-400 cursor-not-allowed'
                                                                            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95'
                                                                            }`}
                                                                    >
                                                                        {payingFeeId === request._id ? (
                                                                            <span className="flex items-center gap-1.5 font-bold">
                                                                                <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24">
                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                                </svg>
                                                                                Processing
                                                                            </span>
                                                                        ) : 'Pay Fee'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                        {request.type === 'COACHING_SESSION' && (
                                                            <span className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase bg-slate-100 px-3 py-1.5 rounded-lg">
                                                                {request.students?.length}/{request.maxStudents} Students
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                {request.status === 'PENDING_RESPONSE' && (
                                                    <div className="flex lg:flex-col items-center gap-2 lg:gap-3 lg:justify-center shrink-0">
                                                        <button
                                                            onClick={() => handleAction(request, 'accept')}
                                                            className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                            title="Accept"
                                                        >
                                                            <CheckCircleIcon className="h-6 w-6 lg:h-7 lg:w-7" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(request, 'reject')}
                                                            className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircleIcon className="h-6 w-6 lg:h-7 lg:w-7" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-slate-500 text-sm font-medium">No tactical requests found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Confirmed Schedule */}
                <div className="flex flex-col space-y-4">
                    <div className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden flex flex-col min-h-[400px]">
                        <div className="px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                    <CalendarDaysIcon className="h-5 w-5" />
                                </div>
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">Confirmed Schedule</h2>
                            </div>
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-lg border border-amber-100">
                                {requests.filter(r => r.status === 'ACCEPTED').length} Confirmed
                            </span>
                        </div>
                        <div className="flex-1 p-4 sm:p-8">
                            {requests.filter(r => r.status === 'ACCEPTED').length > 0 ? (
                                <ul role="list" className="divide-y divide-slate-100">
                                    {requests.filter(r => r.status === 'ACCEPTED').map((request) => (
                                        <li key={request._id} className="relative p-5 sm:p-6 bg-slate-50/50 hover:bg-white rounded-2xl sm:rounded-[2rem] border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-100">
                                                            Confirmed
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                            {new Date(request.availabilitySlot?.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-lg font-extrabold text-slate-900 mb-1 break-words">
                                                        {request.type === 'COACHING_SESSION'
                                                            ? (request.students?.[0]?.name || 'Student') + (request.students?.length > 1 ? ` + ${request.students.length - 1} more` : '')
                                                            : (request.requester?.name || 'Requester')}
                                                    </p>
                                                    {request.type === 'COACHING_SESSION' && (
                                                        <div className="flex items-center gap-3 mt-1 mb-2">
                                                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${request.availabilitySlot?.courtPaymentStatus === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                                                }`}>
                                                                Court: {request.availabilitySlot?.courtPaymentStatus}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {request.students?.length}/{request.maxStudents} Students
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <div className="flex items-center gap-1.5 shrink-0"><ClockIcon className="h-4 w-4 text-indigo-500" /> {request.availabilitySlot?.startTime} - {request.availabilitySlot?.endTime}</div>
                                                        <span className="h-1 w-1 rounded-full bg-slate-200 hidden sm:block" />
                                                        <div className="shrink-0">{request.type.replace('_', ' ')}</div>
                                                        <span className="h-1 w-1 rounded-full bg-slate-200 hidden sm:block" />
                                                        <div className="shrink-0 flex items-center gap-1.5"><MapPinIcon className="h-3.5 w-3.5 text-indigo-500" /> {request.availabilitySlot?.courtName || 'Main Arena'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                                    <div className="h-16 w-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-200">
                                        <CalendarDaysIcon className="h-8 w-8" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">No confirmed sessions</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Confirmed sessions will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachDashboard;
