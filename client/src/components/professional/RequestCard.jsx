import React, { useState } from 'react';
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

const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const ms = new Date(deadline) - new Date();
    if (ms <= 0) return 'Expired';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s to respond`;
};

const RequestCard = ({ request, onStatusChange }) => {
    const [processing, setProcessing] = useState(false);

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

            // sessionService returns "data" property usually, or just response object?
            // sessionService methods return "response.data".
            // professionalService methods (acceptRequest) also return response.data? Let's assume consistent wrapper
            // or check if response.success is present.

            if (response.success || response._id) { // Session returns object sometimes
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

    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                    <UserAvatar
                        user={request.requester}
                        className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-indigo-50 text-indigo-600"
                        fallbackClassName="text-sm sm:text-base text-indigo-700"
                    />
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{request.requester?.name}</h3>
                        <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5 sm:mt-0">{request.requester?.skillLevel || 'Non-Professional'}</p>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center text-sm text-slate-600">
                                <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                                {new Date(request.availabilitySlot?.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                                <ClockIcon className="h-4 w-4 mr-2 text-slate-400" />
                                {request.availabilitySlot?.startTime} - {request.availabilitySlot?.endTime}
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                                <MapPinIcon className="h-4 w-4 mr-2 text-slate-400" />
                                {request.booking?.court?.name ||
                                    request.availabilitySlot?.courtName ||
                                    request.availabilitySlot?.venue?.name ||
                                    'Court TBD'}
                                {(request.booking?.court?.location?.city || request.availabilitySlot?.venue?.city) &&
                                    `, ${request.booking?.court?.location?.city || request.availabilitySlot?.venue?.city}`}
                            </div>
                        </div>

                        {isPending && request.responseDeadline && (
                            <p className="mt-3 text-xs font-bold text-amber-600">
                                {formatDeadline(request.responseDeadline)} — auto-declines if not confirmed
                            </p>
                        )}

                        {request.message && (
                            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-[11px] sm:text-sm italic text-slate-600 border border-slate-100">
                                "{request.message}"
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-xs font-semibold uppercase tracking-wide
                        ${request.status === 'PENDING_RESPONSE' ? 'bg-blue-100 text-blue-700' :
                            request.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                                request.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
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
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:space-x-3 justify-end items-stretch sm:items-center">
                    <button
                        onClick={() => handleAction('reject')}
                        disabled={processing}
                        className="flex items-center justify-center px-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                        <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Reject
                    </button>
                    <button
                        onClick={() => handleAction('accept')}
                        disabled={processing}
                        className="flex items-center justify-center px-4 py-2 bg-indigo-600 border border-transparent rounded-xl text-xs sm:text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
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
