import { createElement, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeftIcon,
    BanknotesIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    MapPinIcon,
    PencilSquareIcon,
    TrophyIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import courtService from '../../services/courtService';
import UserAvatar from '../../components/ui/UserAvatar';

const money = (amount = 0) => `Rs. ${Number(amount || 0).toLocaleString()}`;
const titleCase = (value = '') => value.replace(/_/g, ' ');

const badgeClass = (value) => {
    if (value === 'paid' || value === 'confirmed' || value === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (value === 'cancelled' || value === 'refunded') return 'bg-rose-50 text-rose-700 border-rose-100';
    if (value === 'pending_pro' || value === 'pending_payment' || value === 'pending') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
};

const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA';

const playerName = (registration) =>
    registration.teamName ||
    registration.player?.name ||
    [registration.player1?.name, registration.player2?.name].filter(Boolean).join(' & ') ||
    'Player';

export default function OrganizerCourtDetails() {
    const { courtId } = useParams();
    const [request, setRequest] = useState({ courtId: null, payload: null, error: false });

    useEffect(() => {
        let cancelled = false;
        courtService.getOwnerCourtDetails(courtId)
            .then((res) => {
                if (!cancelled) setRequest({ courtId, payload: res.data, error: false });
            })
            .catch((err) => {
                console.error('Error loading court details:', err);
                if (!cancelled) setRequest({ courtId, payload: null, error: true });
            });
        return () => { cancelled = true; };
    }, [courtId]);

    const loading = request.courtId !== courtId;
    const error = request.courtId === courtId && request.error;
    const payload = request.courtId === courtId ? request.payload : null;
    const court = payload?.court;
    const stats = payload?.stats || {};
    const bookings = payload?.bookings || [];
    const registrations = payload?.registrations || [];
    const tournaments = payload?.tournaments || [];

    const totalRevenue = (stats.bookingRevenue || 0) + (stats.registrationRevenue || 0);
    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (error || !court) {
        return (
            <div className="rounded-3xl border border-dashed border-rose-200 bg-white px-6 py-16 text-center">
                <p className="font-bold text-slate-800">Could not load this court.</p>
                <Link to="/org/courts" className="mt-5 inline-flex rounded-xl bg-indigo-950 px-5 py-3 text-sm font-bold text-amber-50">
                    Back to My Courts
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 pb-20 animate-enter">
            <header className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
                {court.images?.[0] && (
                    <img src={court.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950/90 to-slate-950/70" />
                <div className="relative z-10 p-6 sm:p-8">
                    <Link to="/org/courts" className="inline-flex items-center gap-2 text-sm font-bold text-amber-100/90 hover:text-amber-100">
                        <ArrowLeftIcon className="h-4 w-4" />
                        My Courts
                    </Link>
                    <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">Court details</p>
                            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{court.name}</h1>
                            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                                <MapPinIcon className="h-4 w-4 text-amber-300" />
                                {court.location?.address}, {court.location?.area || 'Lahore'}, Lahore
                            </p>
                        </div>
                        <Link
                            to={`/org/courts/${court._id}/edit`}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-bold text-indigo-950 shadow-lg hover:bg-amber-300"
                        >
                            <PencilSquareIcon className="h-5 w-5" />
                            Edit Court
                        </Link>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Metric label="Bookings" value={stats.bookings} icon={CalendarDaysIcon} />
                <Metric label="Confirmed" value={stats.confirmedBookings} icon={CheckCircleIcon} />
                <Metric label="Booking Revenue" value={money(stats.bookingRevenue)} icon={BanknotesIcon} />
                <Metric label="Registrations" value={stats.registrations} icon={UserGroupIcon} />
                <Metric label="Total Revenue" value={money(totalRevenue)} icon={ChartBarIcon} strong />
            </div>

            <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-extrabold text-slate-900">Tournament Activity</h2>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {tournaments.length ? tournaments.slice(0, 4).map((tournament) => (
                            <div key={tournament._id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-bold text-slate-900">{tournament.name}</p>
                                        <p className="mt-1 text-xs font-medium text-slate-500">{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</p>
                                    </div>
                                    <TrophyIcon className="h-5 w-5 text-amber-600" />
                                </div>
                                <span className={twMerge('mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize', badgeClass(tournament.status))}>
                                    {titleCase(tournament.status)}
                                </span>
                            </div>
                        )) : <p className="text-sm text-slate-500">No tournaments hosted on this court yet.</p>}
                    </div>
            </section>

            <LogTable title="Court Booking Logs" subtitle={`${bookings.length} booking${bookings.length === 1 ? '' : 's'} for this court.`}>
                {bookings.length ? (
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <tr><th className="px-5 py-4">Player</th><th className="px-5 py-4">Schedule</th><th className="px-5 py-4">Purpose</th><th className="px-5 py-4">Booking</th><th className="px-5 py-4">Payment</th><th className="px-5 py-4 text-right">Amount</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bookings.map((booking) => (
                                <tr key={booking._id} className="hover:bg-amber-50/30">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={booking.user} className="h-10 w-10 rounded-xl text-xs" fallbackClassName="text-xs" />
                                            <div>
                                                <p className="font-bold text-slate-900">{booking.user?.name || 'Player'}</p>
                                                <p className="text-xs text-slate-400">{booking.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-600">{formatDate(booking.date)}<br /><span className="text-xs text-slate-400">{booking.startTime} - {booking.endTime}</span></td>
                                    <td className="px-5 py-4 capitalize text-slate-600">{titleCase(booking.purpose)}</td>
                                    <td className="px-5 py-4"><span className={twMerge('rounded-full border px-2.5 py-1 text-xs font-bold capitalize', badgeClass(booking.status))}>{titleCase(booking.status)}</span></td>
                                    <td className="px-5 py-4"><span className={twMerge('rounded-full border px-2.5 py-1 text-xs font-bold capitalize', badgeClass(booking.paymentStatus))}>{booking.paymentStatus}</span></td>
                                    <td className="px-5 py-4 text-right font-black text-indigo-950">{money(booking.totalPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <EmptyLog text="No bookings for this court yet." />}
            </LogTable>

            <LogTable title="Tournament Registration Logs" subtitle={`${registrations.length} registration${registrations.length === 1 ? '' : 's'} from tournaments at this court.`}>
                {registrations.length ? (
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <tr><th className="px-5 py-4">Tournament</th><th className="px-5 py-4">Player / Team</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Payment</th><th className="px-5 py-4 text-right">Amount</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {registrations.map((registration) => (
                                <tr key={registration._id} className="hover:bg-amber-50/30">
                                    <td className="px-5 py-4 font-bold text-slate-900">{registration.tournament?.name}</td>
                                    <td className="px-5 py-4 text-slate-600">{playerName(registration)}</td>
                                    <td className="px-5 py-4 capitalize text-slate-600">{titleCase(registration.category)}</td>
                                    <td className="px-5 py-4"><span className={twMerge('rounded-full border px-2.5 py-1 text-xs font-bold capitalize', badgeClass(registration.status))}>{registration.status}</span></td>
                                    <td className="px-5 py-4"><span className={twMerge('rounded-full border px-2.5 py-1 text-xs font-bold capitalize', badgeClass(registration.paymentStatus))}>{registration.paymentStatus}</span></td>
                                    <td className="px-5 py-4 text-right font-black text-indigo-950">{money(registration.paymentAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <EmptyLog text="No registrations connected to this court yet." />}
            </LogTable>
        </div>
    );
}

function Metric({ label, value = 0, icon, strong = false }) {
    return (
        <div className={twMerge('rounded-3xl border p-5 shadow-sm', strong ? 'border-indigo-200 bg-indigo-950 text-white' : 'border-amber-100 bg-white')}>
            {createElement(icon, { className: twMerge('h-6 w-6', strong ? 'text-amber-300' : 'text-indigo-700') })}
            <p className={twMerge('mt-4 text-[10px] font-bold uppercase tracking-wider', strong ? 'text-indigo-100' : 'text-slate-500')}>{label}</p>
            <p className="mt-1 text-2xl font-black">{value || 0}</p>
        </div>
    );
}

function LogTable({ title, subtitle, children }) {
    return (
        <section className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
            <div className="overflow-x-auto">{children}</div>
        </section>
    );
}

function EmptyLog({ text }) {
    return <div className="px-6 py-14 text-center text-sm font-medium text-slate-500">{text}</div>;
}
