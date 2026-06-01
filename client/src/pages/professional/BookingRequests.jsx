import React, { useState, useEffect } from 'react';
import { getIncomingRequests } from '../../services/professionalService';
import RequestCard from '../../components/professional/RequestCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { InboxIcon, FunnelIcon } from '@heroicons/react/24/outline';

const BookingRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING_RESPONSE');

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

    // Stat counts
    const pendingCount = requests.filter(r => r.status === 'PENDING_RESPONSE').length;
    const acceptedCount = requests.filter(r => r.status === 'ACCEPTED').length;
    const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

    const tabs = [
        { key: 'PENDING_RESPONSE', label: 'Pending', count: pendingCount },
        { key: 'ACCEPTED', label: 'Confirmed', count: acceptedCount },
        { key: 'REJECTED', label: 'Rejected', count: rejectedCount },
        { key: 'ALL', label: 'All', count: requests.length },
    ];

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* ── Gradient Header ─────────────────────────────── */}
            <header className="relative bg-gradient-to-r from-indigo-600 to-amber-500 p-8 rounded-2xl shadow-lg text-white overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Booking Requests</h1>
                        <p className="mt-1 text-sm opacity-90">Manage incoming sparring session requests from players.</p>
                    </div>

                    {/* Live counters */}
                    <div className="flex gap-4">
                        <div className="text-center">
                            <span className="block text-2xl font-extrabold">{pendingCount}</span>
                            <span className="text-xs opacity-80">Pending</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-extrabold">{acceptedCount}</span>
                            <span className="text-xs opacity-80">Confirmed</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-extrabold">{rejectedCount}</span>
                            <span className="text-xs opacity-80">Rejected</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Filter Tabs ─────────────────────────────────── */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-2 shadow-md border border-slate-100">
                <div className="flex items-center gap-2 overflow-x-auto">
                    <FunnelIcon className="h-5 w-5 text-slate-400 shrink-0 ml-2" />
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200
                                ${filter === tab.key
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold
                                ${filter === tab.key
                                    ? 'bg-white/25 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Request List ────────────────────────────────── */}
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
                    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
                        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-amber-50 flex items-center justify-center mb-4 shadow-inner">
                            <InboxIcon className="h-8 w-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No requests found</h3>
                        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                            {filter === 'PENDING_RESPONSE'
                                ? "You're all caught up! No pending requests at the moment."
                                : "No requests match this filter. Try another category."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingRequests;
