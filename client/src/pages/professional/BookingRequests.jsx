import React, { useState, useEffect } from 'react';
import { getIncomingRequests } from '../../services/professionalService';
import RequestCard from '../../components/professional/RequestCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { InboxIcon } from '@heroicons/react/24/outline';

const BookingRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING_RESPONSE'); // PENDING_RESPONSE, ACCEPTED, REJECTED, ALL

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await getIncomingRequests();
            if (response.success) {
                setRequests(response.data);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (id, newStatus) => {
        setRequests(requests.map(req =>
            req._id === id ? { ...req, status: newStatus } : req
        ));
    };

    const filteredRequests = requests.filter(req => {
        if (filter === 'ALL') return true;
        return req.status === filter;
    });

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Booking Requests</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage incoming sparring session requests from players.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['PENDING_RESPONSE', 'ACCEPTED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === status
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {status === 'PENDING_RESPONSE' ? 'Pending' : status === 'ACCEPTED' ? 'Confirmed' : 'Rejected'}
                        </button>
                    ))}
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === 'ALL'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        All
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredRequests.length > 0 ? (
                    filteredRequests.map(request => (
                        <RequestCard
                            key={request._id}
                            request={request}
                            onStatusChange={handleStatusChange}
                        />
                    ))
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 border-dashed">
                        <div className="mx-auto h-12 w-12 text-slate-300 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                            <InboxIcon className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">No requests found</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {filter === 'PENDING_RESPONSE'
                                ? "You're all caught up! No pending requests."
                                : "No requests found for this status."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingRequests;
