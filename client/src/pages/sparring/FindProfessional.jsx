import React, { useState, useEffect } from 'react';
import sparringService from '../../services/sparringService';
import ProfessionalCard from '../../components/professional/ProfessionalCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
    MapPinIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
    SparklesIcon,
    XMarkIcon,
    ChevronRightIcon,
    BoltIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import { twMerge } from 'tailwind-merge';

const FindProfessional = () => {
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cityFilter, setCityFilter] = useState('');

    const [selectedPro, setSelectedPro] = useState(null);
    const [proAvailability, setProAvailability] = useState([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [requestMessage, setRequestMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { success, error: toastError } = useToast();

    useEffect(() => {
        fetchProfessionals();
    }, []);

    const fetchProfessionals = async (city = '') => {
        try {
            setLoading(true);
            const response = await sparringService.getProfessionalsWithAvailability(city);
            setProfessionals(response.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toastError('Failed to load professionals.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProfessionals(cityFilter);
    };

    const handleViewAvailability = async (proWrapper) => {
        const proId = proWrapper.player._id;
        setSelectedPro(proWrapper.player);
        setProAvailability([]);
        setLoadingAvailability(true);

        try {
            const data = await sparringService.getProAvailability(proId);
            setProAvailability(data.data || []);
        } catch (error) {
            console.error('Error fetching availability:', error);
            toastError('Failed to load availability slots.');
        } finally {
            setLoadingAvailability(false);
        }
    };

    const handleSendRequest = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/sparring' } });
            return;
        }

        if (user?.role === 'professional') {
            toastError('Professional players cannot send sparring requests.');
            return;
        }

        if (!selectedSlot) return;

        try {
            setSubmitting(true);
            const payload = {
                proId: selectedPro._id,
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                courtId: (typeof selectedSlot.court === 'string' || selectedSlot.court?._id) ? (selectedSlot.court?._id || selectedSlot.court) : undefined,
                venue: selectedSlot.venue || (!selectedSlot.court?._id ? selectedSlot.court : undefined),
                message: requestMessage,
                price: selectedSlot.matchFee
            };

            await sparringService.sendSparringRequest(payload);
            success('Request sent successfully! The professional has been notified.');

            // Cleanup
            setSelectedSlot(null);
            setSelectedPro(null);
            setRequestMessage('');
            fetchProfessionals(cityFilter);
        } catch (error) {
            console.error(error);
            toastError(error.response?.data?.error || 'Failed to send request');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    // Group availability by date
    const groupedAvailability = proAvailability.reduce((acc, slot) => {
        const dateKey = new Date(slot.date).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
    }, {});

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 sm:mb-12">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Find a Pro Partner</h1>
                    <p className="text-base sm:text-lg text-slate-500 font-medium max-w-2xl">
                        Connect with top-tier professional players for high-intensity sparring sessions. Browse profiles and book confirmed slots instantly.
                    </p>
                </div>
                {isAuthenticated && (
                    <div className="flex gap-4">
                        <Link to="/sparring/requests">
                            <Button variant="outline" className="rounded-2xl h-12 sm:h-14 px-6 sm:px-8 border-slate-200 text-sm">My Requests</Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Simple Filter Bar */}
            <div className="bg-white border border-slate-100 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 mb-8 sm:mb-12 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="relative flex-1">
                        <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                        <input
                            type="text"
                            placeholder="Search by city..."
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl sm:rounded-2xl border border-slate-200 sm:border-none bg-slate-50 font-bold text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                        />
                    </div>
                    <Button type="submit" className="h-12 sm:h-14 px-10 rounded-xl sm:rounded-2xl bg-slate-900 text-white font-bold">Search</Button>
                </form>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-[2.5rem]" />
                    ))}
                </div>
            ) : professionals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {professionals.map((pro) => (
                        <ProfessionalCard
                            key={pro.player._id}
                            professional={{
                                ...pro.profile.toObject?.() || pro.profile,
                                user: pro.player,
                                matchFee: pro.availableSlots?.[0]?.matchFee || pro.profile?.matchFee || 'Variable',
                                rating: pro.profile?.rating || { average: '5.0', count: 12 }
                            }}
                            onSelect={() => handleViewAvailability(pro)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-slate-50 border border-dashed border-slate-200 rounded-[3rem]">
                    <UserIcon className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">No Professionals Found</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">
                        Adjust your filters or check back later for new availability deployments.
                    </p>
                </div>
            )}

            {/* Availability & Booking Modal */}
            <AnimatePresence>
                {selectedPro && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => { setSelectedPro(null); setSelectedSlot(null); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white rounded-t-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden max-h-[100vh] sm:max-h-[90vh] flex flex-col self-end sm:self-center"
                        >
                            {/* Modal Header */}
                            <div className="p-6 sm:p-8 pb-4 flex items-center justify-between border-b border-slate-50">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl sm:text-2xl font-bold">
                                        {selectedPro.name[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{selectedPro.name}</h2>
                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5 sm:mt-1">
                                            <MapPinIcon className="h-3 w-3" />
                                            {selectedPro.city} Pro
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSelectedPro(null); setSelectedSlot(null); }}
                                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                                {loadingAvailability ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="h-12 w-12 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin" />
                                        <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">Scanning Availability Matrix</p>
                                    </div>
                                ) : Object.keys(groupedAvailability).length > 0 ? (
                                    <div className="space-y-10">
                                        {Object.entries(groupedAvailability).map(([date, slots]) => (
                                            <section key={date}>
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                                    <CalendarIcon className="h-4 w-4 text-indigo-500" />
                                                    {formatDate(date)}
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {slots.map(slot => (
                                                        <button
                                                            key={slot._id}
                                                            onClick={() => setSelectedSlot(slot)}
                                                            className={twMerge(
                                                                "p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border transition-all text-left flex flex-col gap-3 sm:gap-4 group relative overflow-hidden",
                                                                selectedSlot?._id === slot._id
                                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100"
                                                                    : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-100"
                                                            )}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2 text-xs sm:text-sm font-black tracking-tight uppercase">
                                                                        <ClockIcon className="h-4 w-4 opacity-60" />
                                                                        {slot.startTime} - {slot.endTime}
                                                                    </div>
                                                                    <div className={twMerge(
                                                                        "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
                                                                        selectedSlot?._id === slot._id ? "text-indigo-200" : "text-slate-400"
                                                                    )}>
                                                                        {(slot.sparringType || 'singles').replace('_', ' ')} Session
                                                                    </div>
                                                                </div>
                                                                <div className={twMerge(
                                                                    "px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black border",
                                                                    selectedSlot?._id === slot._id
                                                                        ? "bg-white/10 border-white/20 text-white"
                                                                        : "bg-emerald-50 border-emerald-100 text-emerald-600"
                                                                )}>
                                                                    PKR {slot.matchFee}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 sm:mt-2">
                                                                <div className={twMerge(
                                                                    "h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl flex items-center justify-center",
                                                                    selectedSlot?._id === slot._id ? "bg-white/10" : "bg-slate-50"
                                                                )}>
                                                                    <MapPinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold leading-none">{slot.venue?.name || 'Local Court'}</span>
                                                                    <span className={twMerge(
                                                                        "text-[10px] font-medium opacity-60 mt-1",
                                                                        selectedSlot?._id === slot._id ? "text-indigo-100" : "text-slate-500"
                                                                    )}>{slot.venue?.city || selectedPro.city}</span>
                                                                </div>
                                                            </div>

                                                            {selectedSlot?._id === slot._id && (
                                                                <motion.div
                                                                    layoutId="check"
                                                                    className="absolute top-2 right-2"
                                                                >
                                                                    <div className="h-6 w-6 bg-white rounded-full flex items-center justify-center">
                                                                        <SparklesIcon className="h-3 w-3 text-indigo-600" />
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 px-8">
                                        <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                            <BoltIcon className="h-10 w-10 text-slate-200" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Slots</h3>
                                        <p className="text-slate-500 font-medium">This professional hasn't deployed any sparring slots for this cycle yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Modal Footer */}
                            <AnimatePresence>
                                {selectedSlot && (
                                    <motion.div
                                        initial={{ y: 200 }}
                                        animate={{ y: 0 }}
                                        exit={{ y: 200 }}
                                        className="p-6 sm:p-8 bg-slate-900 border-t border-slate-800 pb-10 sm:pb-8"
                                    >
                                        <div className="flex flex-col gap-4 sm:gap-6">
                                            <div className="flex items-center justify-between text-white">
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Selected Deployment</p>
                                                    <p className="text-xs sm:text-sm font-bold">Slot ID: {selectedSlot._id.slice(-8).toUpperCase()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Fee</p>
                                                    <p className="text-xl sm:text-2xl font-black tracking-tighter">PKR {selectedSlot.matchFee}</p>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <textarea
                                                    value={requestMessage}
                                                    onChange={(e) => setRequestMessage(e.target.value)}
                                                    placeholder="Operational objectives or strategic notes (optional)..."
                                                    rows={2}
                                                    className="w-full bg-slate-800 border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500 outline-none resize-none"
                                                />
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white text-sm"
                                                    onClick={() => setSelectedSlot(null)}
                                                >
                                                    Reset Selection
                                                </Button>
                                                <Button
                                                    className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-900/40 text-sm"
                                                    onClick={handleSendRequest}
                                                    isLoading={submitting}
                                                >
                                                    Execute Request
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FindProfessional;
