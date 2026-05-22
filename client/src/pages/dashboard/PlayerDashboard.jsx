import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    CalendarIcon,
    UserGroupIcon,
    TrophyIcon,
    PlusIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    ArrowRightIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import courtService from '../../services/courtService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatSlotHour } from '../../utils/timeFormat';
import { twMerge } from 'tailwind-merge';

const STATUS_BADGE = {
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-100 text-amber-900 border-amber-200',
    pending_payment: 'bg-amber-100 text-amber-900 border-amber-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
    completed: 'bg-indigo-100 text-indigo-900 border-indigo-200'
};

const formatStatus = (s) =>
    (s || 'pending').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function StatTile({ icon: Icon, label, value, href, dark }) {
    const inner = (
        <div
            className={twMerge(
                'rounded-2xl border p-5 h-full transition-colors',
                dark
                    ? 'bg-indigo-950 border-indigo-800 text-white hover:bg-indigo-900'
                    : 'bg-white border-amber-100 hover:border-amber-200'
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <div
                    className={twMerge(
                        'h-10 w-10 rounded-xl flex items-center justify-center',
                        dark ? 'bg-white/10 text-amber-200' : 'bg-indigo-950/5 text-indigo-950'
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                {href && <ArrowRightIcon className={twMerge('h-4 w-4', dark ? 'text-amber-300' : 'text-slate-400')} />}
            </div>
            <p className={twMerge('text-[10px] font-bold uppercase tracking-wider', dark ? 'text-indigo-200' : 'text-slate-500')}>
                {label}
            </p>
            <p className={twMerge('text-3xl font-black mt-1', dark ? 'text-white' : 'text-slate-900')}>{value}</p>
        </div>
    );

    if (href) {
        return (
            <Link to={href} className="block h-full">
                {inner}
            </Link>
        );
    }
    return inner;
}

export default function PlayerDashboard() {
    const { user } = useAuth();
    const { error } = useToast();
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setFetchError(false);
            const data = await courtService.getMyBookings();
            const bookings = Array.isArray(data?.data) ? data.data : [];
            setUpcomingBookings(
                bookings.map((b) => ({
                    id: b._id,
                    court: b.court?.name || 'Court',
                    date: new Date(b.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    }),
                    time: formatSlotHour(b.startTime),
                    status: b.status
                }))
            );
        } catch (err) {
            setFetchError(true);
            error('Could not load your bookings.');
        } finally {
            setLoading(false);
        }
    };

    const firstName = user?.name?.split(' ')[0] || 'Player';

    return (
        <div className="pb-24 space-y-8">
            {/* Welcome */}
            <header className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-indigo-950 to-indigo-900 px-5 sm:px-8 py-6 sm:py-8 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div>
                        <p className="text-sm text-indigo-200/90 font-medium">Welcome back</p>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">{firstName}</h1>
                        <p className="text-sm text-indigo-100/80 mt-2">
                            {upcomingBookings.length > 0
                                ? `You have ${upcomingBookings.length} court booking${upcomingBookings.length === 1 ? '' : 's'}.`
                                : 'Book a court to get started.'}
                        </p>
                    </div>
                    <Link to="/courts">
                        <Button className="h-12 px-6 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-indigo-950 gap-2">
                            <PlusIcon className="h-5 w-5" />
                            Book a court
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatTile
                    icon={CalendarIcon}
                    label="Court bookings"
                    value={loading ? '—' : upcomingBookings.length}
                />
                <StatTile icon={UserGroupIcon} label="Sparring" value={0} href="/app/sparring" dark />
                <StatTile icon={TrophyIcon} label="Tournaments" value={0} href="/app/registrations" />
            </div>

            {/* Schedule */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ClockIcon className="h-5 w-5 text-indigo-950" />
                        Upcoming bookings
                    </h2>
                    <Link
                        to="/app/bookings"
                        className="text-sm font-bold text-indigo-800 hover:text-indigo-950 flex items-center gap-1"
                    >
                        View all
                        <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                </div>

                <div className="p-5 sm:p-6">
                    {loading ? (
                        <TableSkeleton rows={3} />
                    ) : fetchError ? (
                        <div className="py-12 text-center">
                            <ExclamationTriangleIcon className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                            <p className="font-bold text-slate-700">Could not load bookings</p>
                            <Button
                                onClick={fetchBookings}
                                variant="outline"
                                className="mt-4 rounded-xl font-bold border-amber-200"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : upcomingBookings.length > 0 ? (
                        <ul className="space-y-3">
                            {upcomingBookings.map((booking) => (
                                <li
                                    key={booking.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 hover:border-amber-200 bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-11 w-11 rounded-lg bg-indigo-950/5 flex items-center justify-center shrink-0">
                                            <MapPinIcon className="h-5 w-5 text-indigo-900" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{booking.court}</p>
                                            <p className="text-sm text-slate-600 mt-0.5">
                                                {booking.date} · {booking.time}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={twMerge(
                                            'text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border w-fit',
                                            STATUS_BADGE[booking.status] || STATUS_BADGE.pending
                                        )}
                                    >
                                        {formatStatus(booking.status)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            icon={CalendarIcon}
                            title="No bookings yet"
                            description="Find a court and reserve your first session."
                            actionLabel="Browse courts"
                            actionHref="/courts"
                        />
                    )}
                </div>
            </section>

            {/* Tournaments teaser */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrophyIcon className="h-5 w-5 text-amber-600" />
                        Tournaments
                    </h2>
                    <Link
                        to="/tournaments"
                        className="text-sm font-bold text-indigo-800 hover:text-indigo-950"
                    >
                        Browse events
                    </Link>
                </div>
                <p className="text-sm text-slate-600 mb-4">No tournament entries yet.</p>
                <Link to="/app/registrations">
                    <Button variant="outline" className="rounded-xl font-bold border-amber-200 text-indigo-950">
                        My registrations
                    </Button>
                </Link>
            </section>
        </div>
    );
}
