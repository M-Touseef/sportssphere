import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import sparringService from '../../services/sparringService';
import { getAllCourts } from '../../services/courtService';
import Button from '../../components/ui/Button';
import {
    MapPinIcon,
    CalendarDaysIcon,
    ClockIcon,
    UserIcon,
    ArrowLeftIcon,
    BoltIcon,
    SparklesIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { formatSlotHour, formatSlotHourRange } from '../../utils/timeFormat';

const BrowseProfessionals = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { success, error: toastError } = useToast();

    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cityFilter, setCityFilter] = useState('');
    const [selectedPro, setSelectedPro] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [requestMessage, setRequestMessage] = useState('');
    const [selectedCourtId, setSelectedCourtId] = useState('');
    const [courts, setCourts] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchProfessionals();
        getAllCourts()
            .then((res) => setCourts(res.data || res || []))
            .catch(() => setCourts([]));
    }, []);

    const fetchProfessionals = async () => {
        try {
            setLoading(true);
            const data = await sparringService.getProfessionalsWithAvailability(cityFilter);
            setProfessionals(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProfessionals();
    };

    const handleSelectSlot = (pro, slot) => {
        setSelectedPro(pro);
        setSelectedSlot(slot);
        setSelectedCourtId('');
    };

    const handleSendRequest = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/sparring/browse' } });
            return;
        }

        if (user?.skillLevel === 'professional') {
            toastError('Professionals cannot send sparring requests. Post your own availability instead.');
            return;
        }

        if (!selectedCourtId) {
            toastError('Please select a court for this session.');
            return;
        }

        try {
            setSubmitting(true);
            await sparringService.sendSparringRequest({
                proId: selectedPro.player._id,
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                courtId: selectedCourtId,
                availabilitySlotId: selectedSlot._id,
                message: requestMessage
            });
            success('Request sent! The professional has 30 minutes to respond, or it will be auto-cancelled.');
            setSelectedSlot(null);
            setSelectedPro(null);
            setRequestMessage('');
            setSelectedCourtId('');
            fetchProfessionals();
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to send request');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Find a Pro Sparring Partner</h1>
                    <p className="mt-3 text-lg text-slate-500 font-medium">
                        Browse professional players and their available slots.
                    </p>
                </div>
                {isAuthenticated && (
                    <Link to="/sparring/requests">
                        <Button variant="outline" className="h-14 px-8 rounded-2xl font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                            My Requests
                        </Button>
                    </Link>
                )}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="bg-white border border-slate-100 rounded-3xl p-8 mb-10 flex gap-4">
                <div className="relative flex-1">
                    <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-600 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Filter by city..."
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-sm focus:ring-4 focus:ring-indigo-100 outline-none"
                    />
                </div>
                <Button type="submit" className="h-14 px-10 rounded-xl font-bold bg-slate-900 text-white">
                    Search
                </Button>
            </form>

            {/* Results */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : professionals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {professionals.map(({ player, availableSlots }) => (
                            <motion.div
                                key={player._id}
                                layout
                                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                            >
                                <div className="p-8">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                                            {player.name?.[0]?.toUpperCase() || 'P'}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-extrabold text-slate-900">{player.name}</h3>
                                            <p className="text-sm text-slate-500">{player.city || 'Location not set'}</p>
                                        </div>
                                        <span className="ml-auto px-4 py-1.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-widest border border-rose-100">
                                            Professional
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Slots ({availableSlots.length})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {availableSlots.slice(0, 4).map(slot => (
                                                <button
                                                    key={slot._id}
                                                    onClick={() => handleSelectSlot({ player, availableSlots }, slot)}
                                                    className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                                                >
                                                    {formatDate(slot.date)} • {formatSlotHour(slot.startTime)}
                                                </button>
                                            ))}
                                            {availableSlots.length > 4 && (
                                                <span className="px-4 py-2 text-xs font-bold text-slate-400">
                                                    +{availableSlots.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center">
                        <UserIcon className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-2xl font-extrabold text-slate-900">No Professionals Available</h3>
                        <p className="text-slate-500 mt-2">Check back later or try a different city.</p>
                    </div>
                )}
            </AnimatePresence>

            {/* Request Modal */}
            <AnimatePresence>
                {selectedSlot && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => { setSelectedSlot(null); setSelectedPro(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                                <SparklesIcon className="h-6 w-6 text-indigo-600" />
                                Request Sparring Session
                            </h2>

                            <div className="bg-slate-50 rounded-2xl p-6 mb-6 space-y-3">
                                <div className="flex items-center gap-3">
                                    <UserIcon className="h-5 w-5 text-indigo-500" />
                                    <span className="font-bold text-slate-900">{selectedPro?.player?.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />
                                    <span className="font-medium text-slate-600">{formatDate(selectedSlot.date)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ClockIcon className="h-5 w-5 text-indigo-500" />
                                    <span className="font-medium text-slate-600">{formatSlotHourRange(selectedSlot.startTime, selectedSlot.endTime)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 text-sm">
                                    <MapPinIcon className="h-5 w-5 text-indigo-500 shrink-0" />
                                    <span>You choose the court below</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <BoltIcon className="h-5 w-5 text-indigo-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{selectedSlot.sparringType}</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Court / venue</label>
                                <select
                                    value={selectedCourtId}
                                    onChange={(e) => setSelectedCourtId(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-sm focus:ring-4 focus:ring-indigo-100 outline-none mb-4"
                                >
                                    <option value="">Select a court…</option>
                                    {courts.map((court) => (
                                        <option key={court._id} value={court._id}>
                                            {court.name} — {court.location?.city}
                                        </option>
                                    ))}
                                </select>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Message (Optional)</label>
                                <textarea
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                    placeholder="Introduce yourself or add a note..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm focus:ring-4 focus:ring-indigo-100 outline-none resize-none"
                                />
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                                <p className="text-xs font-bold text-amber-700">
                                    ⏱️ The professional has <strong>2 hours</strong> to respond. If no response, the request will auto-reject.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => { setSelectedSlot(null); setSelectedPro(null); }}
                                    className="flex-1 h-14 rounded-xl font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSendRequest}
                                    isLoading={submitting}
                                    className="flex-1 h-14 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    Send Request
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BrowseProfessionals;
