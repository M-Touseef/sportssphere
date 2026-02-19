import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import sparringService from '../../services/sparringService';
import Button from '../../components/ui/Button';
import {
    PlusIcon,
    CalendarDaysIcon,
    ClockIcon,
    MapPinIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    BoltIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

const ProSparringDashboard = () => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();

    const [activeTab, setActiveTab] = useState('availability');
    const [mySlots, setMySlots] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        startTime: '09:00',
        endTime: '10:00',
        venue: { name: '', address: '', city: '' },
        sparringType: 'singles',
        notes: ''
    });
    const [acceptedRequest, setAcceptedRequest] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute for countdown accuracy
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Auto-refresh incoming requests every 2 minutes
    useEffect(() => {
        if (activeTab === 'requests') {
            const refreshInterval = setInterval(() => {
                fetchIncomingRequests();
            }, 120000);
            return () => clearInterval(refreshInterval);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'availability') {
            fetchMyAvailability();
        } else {
            fetchIncomingRequests();
        }
    }, [activeTab]);

    // Calculate time remaining for countdown
    const getTimeRemaining = (deadline) => {
        const diff = new Date(deadline) - currentTime;
        if (diff <= 0) return { expired: true, hours: 0, minutes: 0 };
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return { expired: false, hours, minutes };
    };

    const isRequestExpired = (deadline) => {
        return new Date(deadline) <= currentTime;
    };

    const fetchMyAvailability = async () => {
        try {
            setLoading(true);
            const data = await sparringService.getMyAvailability();
            setMySlots(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchIncomingRequests = async () => {
        try {
            setLoading(true);
            const data = await sparringService.getIncomingRequests();
            setIncomingRequests(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('venue.')) {
            const venueField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                venue: { ...prev.venue, [venueField]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        try {
            await sparringService.createAvailability(formData);
            success('Availability slot created successfully!');
            setShowAddForm(false);
            setFormData({
                date: '',
                startTime: '09:00',
                endTime: '10:00',
                venue: { name: '', address: '', city: '' },
                sparringType: 'singles',
                notes: ''
            });
            fetchMyAvailability();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to create slot');
        }
    };

    const handleDeleteSlot = async (id) => {
        if (!window.confirm('Delete this availability slot?')) return;
        try {
            await sparringService.deleteAvailability(id);
            success('Slot deleted.');
            fetchMyAvailability();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to delete slot');
        }
    };

    const handleAccept = async (requestId) => {
        try {
            const response = await sparringService.acceptRequest(requestId);
            success('Sparring session accepted! Both players notified.');
            setAcceptedRequest(response.data);
            fetchIncomingRequests();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to accept request');
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm('Reject this sparring request?')) return;
        try {
            await sparringService.rejectRequest(requestId);
            success('Request rejected. Slot is open again.');
            fetchIncomingRequests();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to reject request');
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
    });

    const getStatusBadge = (status) => {
        const badges = {
            'OPEN': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
            'BOOKED': 'bg-indigo-50 text-indigo-600 border-indigo-100',
            'EXPIRED': 'bg-slate-100 text-slate-500 border-slate-200'
        };
        return badges[status] || 'bg-slate-100 text-slate-500';
    };

    const getRequestBadge = (status) => {
        const badges = {
            'PENDING_RESPONSE': 'bg-amber-50 text-amber-600 border-amber-100',
            'ACCEPTED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'REJECTED': 'bg-rose-50 text-rose-600 border-rose-100',
            'AUTO_REJECTED': 'bg-slate-100 text-slate-500 border-slate-200'
        };
        return badges[status] || 'bg-slate-100 text-slate-500';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Sparring Command</h1>
                    <p className="mt-3 text-lg text-slate-500 font-medium">
                        Manage your availability and respond to sparring requests.
                    </p>
                </div>
                {activeTab === 'availability' && (
                    <Button
                        onClick={() => setShowAddForm(true)}
                        className="h-14 px-8 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 flex items-center gap-2"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Post Availability
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-10">
                <button
                    onClick={() => setActiveTab('availability')}
                    className={twMerge(
                        "px-8 py-4 rounded-2xl font-bold text-sm transition-all",
                        activeTab === 'availability'
                            ? "bg-slate-900 text-white shadow-lg"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    )}
                >
                    My Availability
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={twMerge(
                        "px-8 py-4 rounded-2xl font-bold text-sm transition-all relative",
                        activeTab === 'requests'
                            ? "bg-slate-900 text-white shadow-lg"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    )}
                >
                    Incoming Requests
                    {incomingRequests.filter(r => r.status === 'PENDING_RESPONSE').length > 0 && (
                        <span className="absolute -top-2 -right-2 h-6 w-6 bg-rose-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                            {incomingRequests.filter(r => r.status === 'PENDING_RESPONSE').length}
                        </span>
                    )}
                </button>
            </div>

            {/* Add Slot Modal */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAddForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
                                <SparklesIcon className="h-6 w-6 text-indigo-600" />
                                Post Availability
                            </h2>
                            <form onSubmit={handleAddSlot} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-4 focus:ring-indigo-100 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Type</label>
                                        <select
                                            name="sparringType"
                                            value={formData.sparringType}
                                            onChange={handleInputChange}
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-4 focus:ring-indigo-100 outline-none"
                                        >
                                            <option value="singles">Singles</option>
                                            <option value="doubles">Doubles</option>
                                            <option value="training">Training</option>
                                            <option value="casual">Casual</option>
                                            <option value="competitive">Competitive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Start Time</label>
                                        <input
                                            type="time"
                                            name="startTime"
                                            value={formData.startTime}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-4 focus:ring-indigo-100 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">End Time</label>
                                        <input
                                            type="time"
                                            name="endTime"
                                            value={formData.endTime}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-4 focus:ring-indigo-100 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Venue Name</label>
                                    <input
                                        type="text"
                                        name="venue.name"
                                        value={formData.venue.name}
                                        onChange={handleInputChange}
                                        placeholder="Court or facility name"
                                        required
                                        className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-4 focus:ring-indigo-100 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Address</label>
                                        <input
                                            type="text"
                                            name="venue.address"
                                            value={formData.venue.address}
                                            onChange={handleInputChange}
                                            placeholder="Street address"
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-4 focus:ring-indigo-100 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">City</label>
                                        <input
                                            type="text"
                                            name="venue.city"
                                            value={formData.venue.city}
                                            onChange={handleInputChange}
                                            placeholder="City"
                                            required
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-4 focus:ring-indigo-100 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Notes (Optional)</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        placeholder="Any special instructions..."
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm focus:ring-4 focus:ring-indigo-100 outline-none resize-none"
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowAddForm(false)}
                                        className="flex-1 h-14 rounded-xl font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-14 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        Post Slot
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Booking Confirmation Modal */}
            <AnimatePresence>
                {acceptedRequest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setAcceptedRequest(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-8">
                                <div className="h-20 w-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
                                </div>
                                <h2 className="text-2xl font-extrabold text-slate-900">Session Confirmed!</h2>
                                <p className="text-slate-500 mt-2">The sparring session has been booked successfully.</p>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 space-y-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <UserIcon className="h-5 w-5 text-indigo-500" />
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Partner</p>
                                        <p className="font-bold text-slate-900">{acceptedRequest.requester?.name}</p>
                                        <p className="text-sm text-slate-500">{acceptedRequest.requester?.email}</p>
                                        {acceptedRequest.requester?.phone && (
                                            <p className="text-sm text-indigo-600 font-medium">{acceptedRequest.requester.phone}</p>
                                        )}
                                    </div>
                                </div>

                                {acceptedRequest.availabilitySlot && (
                                    <>
                                        <div className="border-t border-slate-200 pt-4 flex items-center gap-3">
                                            <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase font-bold">Date & Time</p>
                                                <p className="font-bold text-slate-900">
                                                    {formatDate(acceptedRequest.availabilitySlot.date)} • {acceptedRequest.availabilitySlot.startTime} - {acceptedRequest.availabilitySlot.endTime}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border-t border-slate-200 pt-4 flex items-center gap-3">
                                            <MapPinIcon className="h-5 w-5 text-indigo-500" />
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase font-bold">Confirmed Venue</p>
                                                <p className="font-bold text-slate-900">{acceptedRequest.availabilitySlot.venue?.name}</p>
                                                <p className="text-sm text-slate-500">
                                                    {acceptedRequest.availabilitySlot.venue?.address && `${acceptedRequest.availabilitySlot.venue.address}, `}
                                                    {acceptedRequest.availabilitySlot.venue?.city}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                                <p className="text-xs font-bold text-emerald-700">
                                    🔒 Venue and time are now locked. Both players have been notified.
                                </p>
                            </div>

                            <Button
                                onClick={() => setAcceptedRequest(null)}
                                className="w-full h-14 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white"
                            >
                                Close
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : activeTab === 'availability' ? (
                    mySlots.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mySlots.map(slot => (
                                <motion.div
                                    key={slot._id}
                                    layout
                                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={twMerge(
                                            "px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest",
                                            getStatusBadge(slot.status)
                                        )}>
                                            {slot.status}
                                        </span>
                                        {slot.status === 'OPEN' && (
                                            <button
                                                onClick={() => handleDeleteSlot(slot._id)}
                                                className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <CalendarDaysIcon className="h-4 w-4 text-indigo-500" />
                                            <span className="text-sm font-bold">{formatDate(slot.date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <ClockIcon className="h-4 w-4 text-indigo-500" />
                                            <span className="text-sm font-bold">{slot.startTime} - {slot.endTime}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPinIcon className="h-4 w-4 text-indigo-500" />
                                            <span className="text-sm font-medium truncate">{slot.venue.name}, {slot.venue.city}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <BoltIcon className="h-4 w-4 text-indigo-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{slot.sparringType}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center">
                            <CalendarDaysIcon className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-2xl font-extrabold text-slate-900">No Availability Posted</h3>
                            <p className="text-slate-500 mt-2">Post your first availability slot to start receiving requests.</p>
                        </div>
                    )
                ) : (
                    incomingRequests.length > 0 ? (
                        <div className="space-y-6">
                            {incomingRequests.map(req => {
                                const timeRemaining = req.responseDeadline ? getTimeRemaining(req.responseDeadline) : null;
                                const expired = timeRemaining?.expired && req.status === 'PENDING_RESPONSE';

                                return (
                                    <motion.div
                                        key={req._id}
                                        layout
                                        className={twMerge(
                                            "bg-white rounded-3xl border border-slate-100 p-8 shadow-sm",
                                            expired && "opacity-60"
                                        )}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                                        {req.requester?.name?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{req.requester?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-slate-500">{req.requester?.email}</p>
                                                    </div>
                                                    <span className={twMerge(
                                                        "ml-auto px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest",
                                                        expired ? "bg-slate-100 text-slate-500 border-slate-200" : getRequestBadge(req.status)
                                                    )}>
                                                        {expired ? 'EXPIRED' : req.status.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                {/* Countdown Timer */}
                                                {req.status === 'PENDING_RESPONSE' && timeRemaining && !expired && (
                                                    <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl w-fit">
                                                        <ClockIcon className="h-4 w-4 text-amber-600" />
                                                        <span className="text-xs font-bold text-amber-700">
                                                            ⏱️ {timeRemaining.hours}h {timeRemaining.minutes}m remaining
                                                        </span>
                                                    </div>
                                                )}

                                                {expired && (
                                                    <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl w-fit">
                                                        <XCircleIcon className="h-4 w-4 text-slate-500" />
                                                        <span className="text-xs font-bold text-slate-500">
                                                            Response window expired - will be auto-rejected
                                                        </span>
                                                    </div>
                                                )}

                                                {req.availabilitySlot && (
                                                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <CalendarDaysIcon className="h-4 w-4" />
                                                            {formatDate(req.availabilitySlot.date)}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <ClockIcon className="h-4 w-4" />
                                                            {req.availabilitySlot.startTime} - {req.availabilitySlot.endTime}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPinIcon className="h-4 w-4" />
                                                            {req.availabilitySlot.venue?.name}
                                                        </span>
                                                    </div>
                                                )}
                                                {req.message && (
                                                    <p className="mt-3 text-sm text-slate-600 italic">"{req.message}"</p>
                                                )}
                                            </div>
                                            {req.status === 'PENDING_RESPONSE' && !expired && (
                                                <div className="flex gap-3">
                                                    <Button
                                                        onClick={() => handleReject(req._id)}
                                                        variant="outline"
                                                        className="h-12 px-6 rounded-xl font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
                                                    >
                                                        <XCircleIcon className="h-5 w-5 mr-2" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleAccept(req._id)}
                                                        className="h-12 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    >
                                                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                                                        Accept
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center">
                            <UserIcon className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-2xl font-extrabold text-slate-900">No Incoming Requests</h3>
                            <p className="text-slate-500 mt-2">You'll see requests here when non-professional players book your slots.</p>
                        </div>
                    )
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProSparringDashboard;
