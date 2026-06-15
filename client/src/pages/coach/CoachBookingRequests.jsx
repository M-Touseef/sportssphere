import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowPathIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    InboxIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import sparringService from '../../services/sparringService';
import sessionService from '../../services/sessionService';
import RequestCard from '../../components/professional/RequestCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import CoachPageHeader from '../../components/coach/CoachPageHeader';
import { useToast } from '../../context/ToastContext';
import { expandCoachingSessionsForCoach } from '../../utils/coachingSessionRequests';

const FILTERS = [
    { value: 'PENDING_RESPONSE', label: 'Pending' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ALL', label: 'All' }
];

const CoachBookingRequests = () => {
    const { error: showError } = useToast();
    const showErrorRef = useRef(showError);
    showErrorRef.current = showError;
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('PENDING_RESPONSE');

    const fetchRequests = useCallback(async ({ silent = false } = {}) => {
        if (silent) setRefreshing(true);
        try {
            const [sparringResult, coachingResult] = await Promise.all([
                sparringService.getIncomingRequests(),
                sessionService.getCoachSessions()
            ]);
            const normalizedSessions = expandCoachingSessionsForCoach(
                coachingResult?.data || coachingResult || []
            );
            const allRequests = [
                ...(sparringResult?.data || sparringResult || []),
                ...normalizedSessions
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setRequests(allRequests);
        } catch (error) {
            console.error('Error fetching coach requests:', error);
            showErrorRef.current('Failed to load training requests.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const counts = useMemo(() => ({
        PENDING_RESPONSE: requests.filter(request => request.status === 'PENDING_RESPONSE').length,
        ACCEPTED: requests.filter(request => request.status === 'ACCEPTED').length,
        REJECTED: requests.filter(request => request.status === 'REJECTED').length,
        ALL: requests.length
    }), [requests]);

    const filteredRequests = useMemo(() => (
        filter === 'ALL' ? requests : requests.filter(request => request.status === filter)
    ), [filter, requests]);

    const handleStatusChange = (id, newStatus) => {
        setRequests(current => current.map(request => (
            request._id === id ? { ...request, status: newStatus } : request
        )));
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="mx-auto max-w-[1280px] space-y-6 pb-10">
            <CoachPageHeader
                eyebrow="Athlete inbox"
                title="Training requests"
                description="Review every coaching and sparring request with the date, court, athlete, and response status kept together."
                icon={InboxIcon}
                actions={(
                    <>
                        <button
                            type="button"
                            onClick={() => fetchRequests({ silent: true })}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <Link to="/coach/schedule" className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-lime-200">
                            <CalendarDaysIcon className="h-5 w-5" /> Manage schedule
                        </Link>
                    </>
                )}
            >
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-sky-100">{counts.PENDING_RESPONSE} awaiting response</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">{counts.ALL} total requests</span>
                </div>
            </CoachPageHeader>

            <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Needs action</p>
                            <p className="mt-2 text-3xl font-black text-slate-950">{counts.PENDING_RESPONSE}</p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><InboxIcon className="h-5 w-5" /></div>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-700">Accepted</p>
                            <p className="mt-2 text-3xl font-black text-slate-950">{counts.ACCEPTED}</p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-50 text-lime-700"><CheckCircleIcon className="h-5 w-5" /></div>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">Declined</p>
                            <p className="mt-2 text-3xl font-black text-slate-950">{counts.REJECTED}</p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><XCircleIcon className="h-5 w-5" /></div>
                    </div>
                </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-6">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Request queue</p>
                        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">{FILTERS.find(item => item.value === filter)?.label} requests</h2>
                        <p className="mt-1 text-sm text-slate-500">{filteredRequests.length} request{filteredRequests.length === 1 ? '' : 's'} in this view.</p>
                    </div>
                    <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                        {FILTERS.map(item => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setFilter(item.value)}
                                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition sm:px-4 ${
                                    filter === item.value
                                        ? 'bg-white text-sky-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {item.label} <span className="ml-1 text-[10px] opacity-70">{counts[item.value]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    {filteredRequests.length > 0 ? (
                        filteredRequests.map((request, index) => (
                            <RequestCard
                                key={`${request._id}-${request.requester?._id || index}`}
                                request={request}
                                onStatusChange={handleStatusChange}
                            />
                        ))
                    ) : (
                        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200"><InboxIcon className="h-6 w-6" /></div>
                            <h3 className="mt-4 text-sm font-bold text-slate-900">No {FILTERS.find(item => item.value === filter)?.label.toLowerCase()} requests</h3>
                            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Requests matching this status will appear here as athletes contact you.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default CoachBookingRequests;
