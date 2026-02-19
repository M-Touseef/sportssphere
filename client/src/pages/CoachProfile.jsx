import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCoachProfile, getCoachAvailability } from '../services/coachService';
import sparringService from '../services/sparringService';
import sessionService from '../services/sessionService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import {
    MapPinIcon,
    AcademicCapIcon,
    StarIcon,
    BriefcaseIcon,
    CalendarDaysIcon,
    CurrencyDollarIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
    ArrowLeftIcon,
    SparklesIcon,
    CheckBadgeIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

const CoachProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { success, error: toastError } = useToast();

    const [coach, setCoach] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [paymentPlan, setPaymentPlan] = useState('hourly');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Profile and Realized Availability (Recurring)
                const [profileRes, sessionsRes] = await Promise.all([
                    getCoachProfile(id),
                    sessionService.getCoachRealizedAvailability(id)
                ]);
                setCoach(profileRes.data);
                setAvailability(sessionsRes.data);
            } catch (error) {
                console.error('Error fetching coach details:', error);
                toastError('Failed to load coach profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleBooking = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/coaches/${id}` } });
            return;
        }

        if (!selectedSlot) {
            toastError("Please select an available training slot.");
            return;
        }

        try {
            setBookingLoading(true);

            // Request a new session based on the recurring slot
            // Payload must match requestRecurringSession endpoint
            const payload = {
                coachId: coach.user._id, // Coach User ID from profile
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                courtId: selectedSlot.court?._id, // Ensure court is passed if available
                planType: paymentPlan,
                message: bookingMessage
            };

            await sessionService.requestRecurringSession(payload);

            success('Training request sent successfully! The coach will confirm shortly.');
            // Reset selection
            setSelectedSlot(null);
            setBookingMessage('');

            // Refresh availability to remove the booked slot locally (optional but good UX)
            // Note: In real-time apps, we'd refetch, but here we can just filter out
            setAvailability(prev => prev.filter(s => s._id !== selectedSlot._id));

        } catch (error) {
            console.error(error);
            toastError(error.response?.data?.error || 'Request failed.');
        } finally {
            setBookingLoading(false);
        }
    };


    const renderStars = (rating) => {
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <StarIcon
                        key={i}
                        className={twMerge(
                            "h-5 w-5",
                            i < Math.round(rating) ? "text-amber-400 fill-current" : "text-slate-200"
                        )}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-6">
                <div className="h-16 w-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-xl shadow-indigo-100" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Syncing Mentor Profile</p>
            </div>
        );
    }

    if (!coach) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <AcademicCapIcon className="h-20 w-20 text-slate-200 mx-auto mb-6" />
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Profile Missing</h2>
                <div className="mt-8">
                    <Link to="/coaches">
                        <Button variant="outline" className="px-10 h-14 font-bold border-slate-200 rounded-2xl">Return to Directory</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32">
            <div className="mb-8">
                <Link to="/coaches" className="group flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
                    <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Mentor Network Registry
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left Column: Profile */}
                <div className="lg:col-span-8 space-y-12">
                    <div className="bg-white shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 rounded-[3rem] overflow-hidden">
                        <div className="h-40 bg-gradient-to-r from-indigo-600 to-indigo-900 relative">
                            <div className="absolute inset-0 bg-slate-900/10" />
                        </div>

                        <div className="px-10 pb-12">
                            <div className="relative -mt-16 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                                <div className="flex flex-col md:flex-row md:items-end gap-8">
                                    <div className="h-40 w-40 rounded-[2.5rem] bg-white border-8 border-white flex items-center justify-center text-slate-900 text-6xl font-black shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700">
                                            {coach.user.name[0].toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="pb-4">
                                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter mb-4">{coach.user.name}</h1>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
                                                {renderStars(coach.rating.average)}
                                                <span className="text-sm font-bold text-amber-700 ml-1">{coach.rating.average}</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">({coach.rating.count} Verified Logs)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                        <MapPinIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Division</p>
                                        <p className="text-sm font-bold text-slate-800">{coach.user.city}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                        <BriefcaseIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Tenure</p>
                                        <p className="text-sm font-bold text-slate-800">{coach.experience} Years Experience</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                        <CurrencyDollarIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hourly Rate</p>
                                        <p className="text-sm font-bold text-slate-800">Rs. {coach.hourlyRate} / Session</p>
                                    </div>
                                </div>
                                {coach.monthlyFee && (
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                            <CurrencyDollarIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Rate</p>
                                            <p className="text-sm font-bold text-emerald-800">Rs. {coach.monthlyFee} / Month</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-16">
                                <section>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="h-8 w-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            <InformationCircleIcon className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">Professional Dossier</h2>
                                    </div>
                                    <p className="text-lg text-slate-500 leading-relaxed font-medium">
                                        {coach.bio || "Elite performance mentor specializing in high-intensity biomechanical correction and tactical match propagation protocols."}
                                    </p>
                                </section>

                                <section>
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="h-8 w-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            <AcademicCapIcon className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">Technical Specializations</h2>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {coach.specialization.map((spec, index) => (
                                            <span
                                                key={index}
                                                className="px-6 py-3 bg-white border border-slate-100 shadow-sm rounded-2xl text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-default"
                                            >
                                                {spec.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Booking */}
                <div className="lg:col-span-4 sticky top-6">
                    <div className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] border border-slate-100 rounded-[3rem] overflow-hidden">
                        <div className="p-8 bg-slate-900 border-b border-indigo-900/10 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-extrabold tracking-tight">Sync Session</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Book Coaching</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                <SparklesIcon className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Available Slots List */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Available Slots</h4>
                                {availability.length > 0 ? (
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {availability.map((slot) => (
                                            <div
                                                key={slot._id}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedSlot?._id === slot._id
                                                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                                                    : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-slate-900">
                                                        {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${(slot.maxStudents - slot.enrolledCount) <= 0
                                                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            }`}>
                                                            {slot.maxStudents - slot.enrolledCount > 0
                                                                ? `${slot.maxStudents - slot.enrolledCount} spots left`
                                                                : 'Full'}
                                                        </span>
                                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                                            {slot.court?.name || 'Main Hall'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-sm text-slate-500 font-medium">
                                                    <ClockIcon className="h-4 w-4 mr-1" />
                                                    {slot.startTime} - {slot.endTime}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-sm text-slate-500 font-medium">No slots available currently</p>
                                    </div>
                                )}
                            </div>

                            {selectedSlot && (
                                <form onSubmit={handleBooking} className="space-y-6 animate-fade-in-up">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Plan</label>
                                        <select
                                            value={paymentPlan}
                                            onChange={(e) => setPaymentPlan(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                        >
                                            <option value="hourly">Hourly (Rs. {coach.hourlyRate})</option>
                                            {coach.monthlyFee && <option value="monthly">Monthly (Rs. {coach.monthlyFee})</option>}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Message (Optional)</label>
                                        <textarea
                                            value={bookingMessage}
                                            onChange={(e) => setBookingMessage(e.target.value)}
                                            placeholder="Notes for the coach..."
                                            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-100 outline-none h-24 resize-none"
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                                            <span className="text-2xl font-black text-slate-900">
                                                Rs. {paymentPlan === 'hourly' ? coach.hourlyRate : coach.monthlyFee}
                                            </span>
                                        </div>
                                        <Button
                                            type="submit"
                                            isLoading={bookingLoading}
                                            fullWidth
                                            size="lg"
                                            className="h-14 font-bold bg-slate-900 text-white hover:bg-indigo-600 rounded-xl shadow-lg"
                                        >
                                            <CheckBadgeIcon className="h-5 w-5 mr-2" />
                                            Send Request
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachProfile;
