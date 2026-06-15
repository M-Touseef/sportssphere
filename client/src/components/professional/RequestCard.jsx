import { useEffect, useState } from 'react';
import {
    CalendarIcon,
    ClockIcon,
    MapPinIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { acceptRequest, rejectRequest } from '../../services/professionalService';
import sessionService from '../../services/sessionService';
import UserAvatar from '../ui/UserAvatar';

const formatDeadline = (deadline, now) => {
    if (!deadline) return null;
    const ms = new Date(deadline) - now;
    if (ms <= 0) return 'Expired';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s to respond`;
};

const RequestCard = ({ request, onStatusChange }) => {
    const [processing, setProcessing] = useState(false);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (request.status !== 'PENDING_RESPONSE' || !request.responseDeadline) return undefined;

        const timer = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(timer);
    }, [request.responseDeadline, request.status]);

    const handleAction = async (action) => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;

        setProcessing(true);
        try {
            let response;
            if (request.type === 'COACHING_SESSION') {
                const apiCall = action === 'accept' ? sessionService.confirmSession : sessionService.rejectSession;
                response = await apiCall(request._id);
            } else {
                const apiCall = action === 'accept' ? acceptRequest : rejectRequest;
                response = await apiCall(request._id);
            }

            if (response.success || response._id) {
                onStatusChange(request._id, action === 'accept' ? 'ACCEPTED' : 'REJECTED');
            }
        } catch (error) {
            console.error(`Error ${action}ing request:`, error);
            alert(`Failed to ${action} request`);
        } finally {
            setProcessing(false);
        }
    };

    const isPending = request.status === 'PENDING_RESPONSE';
    const requestDate = request.availabilitySlot?.date || request.booking?.date;
    const requestStartTime = request.availabilitySlot?.startTime || request.booking?.startTime;
    const requestEndTime = request.availabilitySlot?.endTime || request.booking?.endTime;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-start space-x-4">
                    <UserAvatar
                        user={request.requester}
                        className="h-11 w-11 rounded-xl bg-sky-50 text-sky-700 sm:h-12 sm:w-12"
                        fallbackClassName="text-sm text-sky-700 sm:text-base"
                    />
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{request.requester?.name}</h3>
                        <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5 sm:mt-0">{request.requester?.skillLevel || 'Non-Professional'}</p>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center text-sm text-slate-600">
                                <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                                {requestDate ? new Date(requestDate).toLocaleDateString() : 'Date unavailable'}
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                                <ClockIcon className="h-4 w-4 mr-2 text-slate-400" />
                                {requestStartTime && requestEndTime
                                    ? `${requestStartTime} - ${requestEndTime}`
                                    : 'Time unavailable'}
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                                <MapPinIcon className="h-4 w-4 mr-2 text-slate-400" />
                                {request.booking?.court?.name ||
                                    request.availabilitySlot?.courtName ||
                                    request.availabilitySlot?.venue?.name ||
                                    'Court TBD'}
                                {(request.booking?.court?.location?.area || request.availabilitySlot?.venue?.area || request.booking?.court?.location?.city || request.availabilitySlot?.venue?.city) &&
                                    `, ${request.booking?.court?.location?.area || request.availabilitySlot?.venue?.area || request.booking?.court?.location?.city || request.availabilitySlot?.venue?.city}`}
                            </div>
                        </div>

                        {isPending && request.responseDeadline && (
                            <p className="mt-3 text-xs font-bold text-amber-600">
                                {formatDeadline(request.responseDeadline, now)} - auto-declines if not confirmed
                            </p>
                        )}

                        {request.message && (
                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] italic text-slate-600 sm:text-sm">
                                "{request.message}"
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-xs font-semibold uppercase tracking-wide
                        ${request.status === 'PENDING_RESPONSE' ? 'bg-amber-100 text-amber-800' :
                            request.status === 'ACCEPTED' ? 'bg-lime-100 text-lime-800' :
                                request.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                    'bg-slate-100 text-slate-700'}`}>
                        {request.status.replace('_', ' ')}
                    </span>

                    {request.availabilitySlot?.matchFee && (
                        <span className="mt-2 text-base sm:text-lg font-bold text-slate-900">
                            PKR {request.availabilitySlot.matchFee}
                        </span>
                    )}
                </div>
            </div>

            {isPending && (
                <div className="mt-6 flex flex-col items-stretch justify-end gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                    <button
                        onClick={() => handleAction('reject')}
                        disabled={processing}
                        className="flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 sm:text-sm"
                    >
                        <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Reject
                    </button>
                    <button
                        onClick={() => handleAction('accept')}
                        disabled={processing}
                        className="flex items-center justify-center rounded-xl border border-transparent bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-sky-900 disabled:opacity-50 sm:text-sm"
                    >
                        {processing ? 'Processing...' : (
                            <>
                                <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Accept Request
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RequestCard;
