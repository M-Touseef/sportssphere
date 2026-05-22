import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import courtService from '../services/courtService';
import { useToast } from '../context/ToastContext';
import { payForBooking } from '../services/paymentService';
import {
    CalendarIcon,
    MapPinIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const MyBookings = () => {
    const { error, success } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [payingBookingId, setPayingBookingId] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setFetchError(false);
            const data = await courtService.getMyBookings();
            setBookings(data.data.map(b => ({
                id: b._id,
                court: b.court.name,
                location: b.court.location?.address || b.court.location?.city || 'Main Center',
                date: new Date(b.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                time: b.startTime,
                endTime: b.endTime,
                price: b.totalPrice,
                status: b.status,
                paymentStatus: b.paymentStatus,
                txnRefNo: b.txnRefNo || null
            })));
        } catch (err) {
            setFetchError(true);
            error('Failed to load your schedule.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePayNow = async (bookingId) => {
        try {
            setPayingBookingId(bookingId);
            const result = await payForBooking(bookingId);
            if (result?.completed) {
                success('Payment confirmed (demo mode). Your booking is active.');
                await fetchBookings();
                setPayingBookingId(null);
            }
        } catch (err) {
            console.error('[PayNow] Error:', err);
            const msg = err?.response?.data?.error || 'Could not initiate payment. Please try again.';
            error(msg);
            setPayingBookingId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Schedule</h1>
                    <p className="text-slate-500 font-medium mt-2">Manage your court bookings and upcoming games.</p>
                </div>
                <Link to="/courts">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 h-12 shadow-lg shadow-indigo-100">
                        Book a Court
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                    <TableSkeleton rows={5} />
                </div>
            ) : fetchError ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] border border-slate-100 text-center gap-6">
                    <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-300">
                        <ExclamationTriangleIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-700">Unable to load schedule</p>
                        <p className="text-slate-400 text-sm mt-1">We couldn't fetch your bookings. Please try again.</p>
                    </div>
                    <Button onClick={fetchBookings} variant="outline" className="px-8 h-11 font-bold border-slate-200">
                        Retry
                    </Button>
                </div>
            ) : bookings.length > 0 ? (
                <div className="grid gap-6">
                    {bookings.map((booking) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative flex flex-col md:flex-row bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all duration-300"
                        >
                            <div className="flex-1 flex gap-6 items-start">
                                <div className="h-20 w-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                    <CalendarIcon className="h-10 w-10" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {booking.court}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            booking.status === 'pending' || booking.status === 'pending_payment' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                booking.status === 'pending_pro' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {booking.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 mb-4">
                                        <MapPinIcon className="h-4 w-4 text-slate-400" />
                                        {booking.location}
                                    </p>

                                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <CalendarIcon className="h-4 w-4 text-indigo-500" />
                                            {booking.date}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <ClockIcon className="h-4 w-4 text-indigo-500" />
                                            {booking.time} - {booking.endTime || '1 Hour'}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <span className="text-indigo-500">Rs.</span>
                                            {booking.price}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 md:mt-0 md:ml-6 flex flex-col items-end justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                                {booking.paymentStatus === 'paid' ? (
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">
                                        ✓ Paid
                                    </span>
                                ) : booking.status === 'pending_payment' ? (
                                    <button
                                        id={`pay-now-${booking.id}`}
                                        onClick={() => handlePayNow(booking.id)}
                                        disabled={payingBookingId === booking.id}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-emerald-100"
                                    >
                                        {payingBookingId === booking.id ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Redirecting…
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                                    <path d="M2 10h20" />
                                                </svg>
                                                Pay Now via JazzCash
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 uppercase tracking-widest">
                                        {booking.status === 'pending_pro' ? 'Awaiting Professional' : 'Payment Pending'}
                                    </span>
                                )}

                                <Button variant="outline" className="w-full md:w-auto text-xs font-bold border-slate-200">
                                    View Details
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-12 flex items-center justify-center">
                    <EmptyState
                        icon={CalendarIcon}
                        title="No Bookings Yet"
                        description="You haven't booked any courts yet. Start your journey by booking a court today!"
                        actionLabel="Book a Court"
                        actionHref="/courts"
                    />
                </div>
            )}
        </div>
    );
};

export default MyBookings;
