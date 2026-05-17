import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import courtService from '../services/courtService';
import { formatSlotHour } from '../utils/timeFormat';
import { payForBooking } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Tooltip from '../components/ui/Tooltip';
import {
    MapPinIcon,
    CalendarIcon,
    ClockIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
    WifiIcon,
    TableCellsIcon,
    StarIcon,
    ArrowLeftIcon,
    ShareIcon,
    HeartIcon,
    CheckCircleIcon,
    SparklesIcon,
    UserIcon,
    ArrowPathIcon,
    PencilSquareIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline';
import ProSelectionList from '../components/booking/ProSelectionList';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const CourtDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { success, error: toastError } = useToast();

    const [court, setCourt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingStep, setBookingStep] = useState('selecting_slot'); // 'selecting_slot' | 'selecting_pro' | 'payment_prompt'
    const [selectedPro, setSelectedPro] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        fetchCourtDetails();
    }, [id]);

    useEffect(() => {
        if (court) {
            fetchAvailability();
        }
    }, [selectedDate, court]);

    const fetchCourtDetails = async () => {
        try {
            const data = await courtService.getCourt(id);
            setCourt(data.data);
        } catch (error) {
            console.error('Error fetching court details:', error);
            toastError('Failed to load court details.');
        } finally {
            setLoading(false);
        }
    };

    // Handle pre-selection from Discovery Page
    const location = useLocation();
    useEffect(() => {
        if (location.state && location.state.preSelectedPro && slots.length > 0) {
            const { date, time, preSelectedPro } = location.state;

            // 1. Set Date
            if (date && date !== selectedDate) {
                setSelectedDate(date);
            }

            // 2. Select Slot (after slots are loaded for that date)
            const targetSlot = slots.find(s => s.time === time);
            if (targetSlot && targetSlot.available) {
                setSelectedSlot(targetSlot);
                setBookingStep('selecting_pro'); // Skip to pro selection part
                // We could also auto-select the pro inside ProSelectionList if we pass it down
                // OR we can set it here if ProSelectionList is not strictly required strictly for data fetching
            }
        }
    }, [location.state, slots, selectedDate]);

    const fetchAvailability = async () => {
        try {
            const data = await courtService.getAvailability(id, selectedDate);
            setSlots(data.data);
        } catch (error) {
            console.error('Error fetching availability:', error);
        }
    };

    const handleBooking = async (proData = null) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/courts/${id}` } });
            return;
        }

        if (!selectedSlot) return;

        try {
            setBookingLoading(true);

            const hours = parseInt(selectedSlot.time.split(':')[0], 10);
            const endTime = `${(hours + 1).toString().padStart(2, '0')}:00`;

            const bookingPayload = {
                courtId: id,
                date: selectedDate,
                startTime: selectedSlot.time,
                endTime,
            };

            if (proData) {
                bookingPayload.proPlayerId = proData.player._id;
                // Only attach slotId if it's a legacy date-specific slot, not a recurring one
                if (!proData.isRecurring) {
                    bookingPayload.slotId = proData.slot?._id;
                }
            }

            const response = await courtService.createBooking(bookingPayload);
            const booking = response.data;
            setSelectedBooking(booking);

            if (proData) {
                success(`Request sent to ${proData.player.name}. You will be notified when they accept.`);
                fetchAvailability();
                setSelectedSlot(null);
                setSelectedPro(null);
                setBookingStep('selecting_slot');
            } else {
                success(`Booking created. Action Required: Please complete payment.`);
                setBookingStep('payment_prompt');

                // Keep auto-redirect as a courtesy, but user now has a manual button too
                setTimeout(async () => {
                    try {
                        // Only auto-redirect if we are still on the prompt step
                        if (window.location.pathname.includes(`/courts/${id}`)) {
                            await payForBooking(booking._id);
                        }
                    } catch (payErr) {
                        console.error('Auto-redirect failed:', payErr);
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Booking Error:', error);
            const errorMessage = error.response?.data?.error || 'Booking failed.';
            toastError(errorMessage);

            // If the error is about slot being already booked, re-fetch availability
            if (errorMessage.includes('booked') || errorMessage.includes('reserved')) {
                fetchAvailability();
                setSelectedSlot(null);
            }
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-6">
                <div className="h-16 w-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-xl shadow-indigo-100" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading Court Details...</p>
            </div>
        );
    }

    const ownerId = court?.owner && (typeof court.owner === 'object' ? court.owner._id || court.owner.id : court.owner);
    const isCourtOwner =
        user &&
        court &&
        ownerId != null &&
        String(ownerId) === String(user.id || user._id);

    if (!court) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <div className="h-24 w-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100">
                    <MapPinIcon className="h-12 w-12 text-slate-200" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Court Not Found</h2>
                <p className="text-slate-500 font-medium mt-4 max-w-sm mx-auto">The court you are looking for is not in our records.</p>
                <div className="mt-12">
                    <Link to="/courts">
                        <Button variant="outline" className="px-10 h-14 font-bold border-slate-200 rounded-2xl">Back to Courts</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-32">
            {/* Header & Breadcrumb */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-12">
                <Link to="/courts" className="group flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">Back to List</span>
                </Link>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:ml-auto">
                    {isCourtOwner && (
                        <>
                            <Link
                                to="/org/courts"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                                <Squares2X2Icon className="h-4 w-4" />
                                My courts
                            </Link>
                            <Link
                                to={`/org/courts/${id}/edit`}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                                Edit listing
                            </Link>
                        </>
                    )}
                    <button type="button" className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                        <ShareIcon className="h-4.5 w-4.5" />
                    </button>
                    <button type="button" className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm">
                        <HeartIcon className="h-4.5 w-4.5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8 sm:space-y-12">
                    <div className="bg-white shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden">
                        <div className="relative h-64 md:h-[500px] w-full overflow-hidden">
                            {court.images && court.images.length > 0 ? (
                                <img
                                    src={court.images[0]}
                                    alt={court.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                                    <TableCellsIcon className="h-24 w-24 text-slate-100" />
                                </div>
                            )}
                            <div className="absolute top-8 left-8">
                                <span className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full text-xs font-bold text-indigo-600 border border-white/50 shadow-sm uppercase tracking-widest">
                                    {court.surfaceType} Surface
                                </span>
                            </div>
                        </div>

                        <div className="p-6 sm:p-10 md:p-14">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
                                <div className="max-w-2xl">
                                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-[1.1] mb-4 sm:mb-6 break-words">
                                        {court.name}
                                    </h1>
                                    <div className="flex items-center gap-2.5 text-slate-500 font-bold break-words">
                                        <MapPinIcon className="h-5 w-5 text-indigo-600 shrink-0" />
                                        <span className="text-sm uppercase tracking-wider">{court.location.address}, {court.location.city}</span>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6 min-w-0 shrink-0 self-start md:mt-2">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => <StarIcon key={i} className="h-3.5 w-3.5 text-amber-400 fill-current" />)}
                                    </div>
                                    <div className="h-8 w-px bg-slate-200" />
                                    <div className="text-right">
                                        <p className="text-xl font-extrabold text-slate-900 leading-none">4.9</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Verified</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-14 pt-14 border-t border-slate-50">
                                <section>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="h-8 w-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            <InformationCircleIcon className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest text-slate-900">Court Details</h2>
                                    </div>
                                    <p className="text-lg text-slate-500 leading-relaxed font-medium">
                                        {court.description || "Premium court featuring excellent lighting and a professional playing surface. Optimized for competitive play and training."}
                                    </p>
                                </section>

                                <section>
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="h-8 w-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                            <ShieldCheckIcon className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest text-slate-900">Facilities</h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {court.amenities.length > 0 ? court.amenities.map((amenity, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all"
                                            >
                                                <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                                                <span className="text-sm font-bold text-slate-600">{amenity}</span>
                                            </div>
                                        )) : (
                                            ['Pro Lighting', 'Secure Storage', 'Digital Uplink', 'Recovery Zone'].map((amenity, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100"
                                                >
                                                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                                                    <span className="text-sm font-bold text-slate-600">{amenity}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Reservation Card */}
                <div className="lg:col-span-4">
                    <div className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] border border-slate-100 rounded-3xl sm:rounded-[3rem] overflow-hidden sticky top-32 max-h-[calc(100vh-140px)] flex flex-col">
                        <div className="overflow-y-auto custom-scrollbar flex-1 pb-6 sm:pb-10">
                            <div className="p-6 sm:p-8 bg-slate-900 border-b border-indigo-900/10 flex justify-between items-start relative overflow-hidden text-white">
                                <div className="relative z-10 flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-2 text-slate-400">Booking Fee</p>
                                    <div className="flex flex-wrap items-baseline gap-1.5">
                                        <span className="text-2xl sm:text-3xl font-black tracking-tighter overflow-hidden text-ellipsis">Rs.{court.pricePerHour}</span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest leading-none">/ session</span>
                                    </div>
                                </div>
                                <div className="relative z-10 h-10 w-10 rounded-xl bg-indigo-500/20 shrink-0 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                    <SparklesIcon className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="p-6 sm:p-10 space-y-8 sm:space-y-10">
                                {bookingStep === 'selecting_slot' ? (
                                    <div className="space-y-8">
                                        <div>
                                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 block ml-1">
                                                Select Date
                                            </label>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-indigo-500 pointer-events-none" />
                                                <input
                                                    id="booking-date"
                                                    name="booking-date"
                                                    type="date"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={selectedDate}
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                    className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-slate-50/30 font-bold text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-5">
                                                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">
                                                    Available Slots
                                                </label>
                                                <span className="text-xs sm:text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                                                    {slots.filter(s => s.available).length} Active
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
                                                {slots.map((slot) => (
                                                    <button
                                                        key={slot.time}
                                                        disabled={!slot.available}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={twMerge(
                                                            "py-3.5 text-xs sm:text-sm font-bold rounded-2xl border transition-all relative overflow-hidden",
                                                            !slot.available
                                                                ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                                                : selectedSlot?.time === slot.time
                                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100"
                                                                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {formatSlotHour(slot.time)}
                                                        {!slot.available && (
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-10 rotate-12">
                                                                <span className="text-xs font-black uppercase">BOOKED</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            {slots.length === 0 && (
                                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                    <ClockIcon className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Grid Offline</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Button
                                                    onClick={() => handleBooking(null)}
                                                    disabled={!selectedSlot || bookingLoading}
                                                    fullWidth
                                                    size="lg"
                                                    isLoading={bookingLoading}
                                                    className="h-16 text-base font-bold rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                                                >
                                                    Book Court Only
                                                </Button>
                                                <Button
                                                    onClick={() => setBookingStep('selecting_pro')}
                                                    disabled={!selectedSlot || bookingLoading}
                                                    fullWidth
                                                    size="lg"
                                                    className="h-16 text-base font-bold shadow-xl shadow-indigo-100 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white"
                                                >
                                                    Continue to Pro Selection
                                                </Button>
                                            </div>
                                        </div>

                                        {!isAuthenticated && (
                                            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                                                <p className="text-sm font-bold text-slate-500 leading-relaxed">
                                                    Please log in to book this court. <Link to="/register" className="text-indigo-600 hover:text-indigo-800 transition-colors underline underline-offset-4">Join Hub</Link>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : bookingStep === 'selecting_pro' ? (
                                    <ProSelectionList
                                        date={selectedDate}
                                        startTime={selectedSlot?.time}
                                        city={court.location.city}
                                        onSelect={(proData) => handleBooking(proData)}
                                        onCancel={() => setBookingStep('selecting_slot')}
                                        preSelectedPro={location.state?.preSelectedPro}
                                    />
                                ) : (
                                    <div className="space-y-6 text-center py-4">
                                        <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4 border border-amber-100">
                                            <SparklesIcon className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">Payment Required</h3>
                                            <p className="text-base text-slate-500 mt-2 font-medium">To confirm your booking for {selectedSlot?.time}, please complete the JazzCash transaction.</p>
                                        </div>

                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2">
                                            <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Court</span>
                                                <span className="text-slate-900">{court.name}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Amount</span>
                                                <span className="text-indigo-600">Rs. {court.pricePerHour}</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => payForBooking(selectedBooking?._id)}
                                            fullWidth
                                            size="lg"
                                            className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-3"
                                        >
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                                <path d="M2 10h20" />
                                            </svg>
                                            Pay Now via JazzCash
                                        </Button>

                                        <button
                                            onClick={() => {
                                                setBookingStep('selecting_slot');
                                                setSelectedSlot(null);
                                                fetchAvailability();
                                            }}
                                            className="text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                        >
                                            Dismiss & Back to Schedule
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourtDetails;
