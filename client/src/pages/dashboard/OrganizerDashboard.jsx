import { createElement, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BanknotesIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ClockIcon,
    MapPinIcon,
    PlusIcon,
    TrophyIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import StatTile from '../../components/ui/StatTile';
import courtService from '../../services/courtService';

const money = (amount = 0) => `Rs. ${Number(amount).toLocaleString()}`;
const titleCase = (value = '') => value.replace(/_/g, ' ');

function badgeClass(value) {
    if (value === 'paid' || value === 'confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (value === 'cancelled' || value === 'refunded') return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
}

export default function OrganizerDashboard() {
    const [overview, setOverview] = useState({ stats: {}, bookings: [], courts: [] });
    const [loading, setLoading] = useState(true);
    const [expandedCourt, setExpandedCourt] = useState(null);

    useEffect(() => {
        let cancelled = false;
        courtService.getOwnerOverview()
            .then((res) => {
                if (!cancelled && res?.data) setOverview(res.data);
            })
            .catch((error) => console.error('Error loading owner overview:', error))
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const { stats, bookings, courts } = overview;
    const display = (value) => loading ? '...' : String(value || 0);

    return (
        <div className="mx-auto max-w-7xl space-y-8 pb-20 animate-enter">
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 to-amber-500 p-6 text-white shadow-lg sm:p-8">
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-100">Court owner workspace</p>
                        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Court Owner Dashboard</h1>
                        <p className="mt-3 max-w-2xl text-sm font-medium text-white/90 sm:text-base">
                            Track your courts, received bookings, and payment status from one place.
                        </p>
                    </div>
                    <Link to="/org/courts/create" className="inline-flex h-12 items-center gap-2 self-start rounded-xl bg-white px-5 text-sm font-bold text-indigo-700 shadow-lg hover:bg-indigo-50">
                        <PlusIcon className="h-5 w-5" />
                        Add Court
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatTile label="Published Courts" value={display(stats.courts)} icon={BuildingOffice2Icon} href="/org/courts" />
                <StatTile label="Bookings Received" value={display(stats.bookings)} icon={CalendarDaysIcon} />
                <StatTile label="Confirmed Bookings" value={display(stats.confirmedBookings)} icon={CheckCircleIcon} />
                <StatTile label="Payments Received" value={loading ? '...' : money(stats.paidAmount)} icon={BanknotesIcon} />
                <StatTile label="Payment Pending" value={loading ? '...' : money(stats.pendingAmount)} icon={ClockIcon} />
            </div>

            <section className="space-y-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Court Performance</h2>
                    <p className="mt-1 text-sm text-slate-500">Open a court to see its bookings, tournaments, and registration details separately.</p>
                </div>
                {!loading && courts.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-amber-200 bg-white px-6 py-12 text-center text-slate-500">Add your first court to start tracking venue activity.</div>
                ) : (
                    courts.map((court) => {
                        const expanded = expandedCourt === court._id;
                        return (
                            <article key={court._id} className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
                                <button type="button" onClick={() => setExpandedCourt(expanded ? null : court._id)} className="flex w-full flex-col gap-4 p-5 text-left hover:bg-amber-50/30 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900">{court.name}</h3>
                                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPinIcon className="h-4 w-4" />{court.location?.address}, {court.location?.city}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        <span><strong>{court.stats?.bookings || 0}</strong> bookings</span>
                                        <span><strong>{court.stats?.registrations || 0}</strong> registrations</span>
                                        <span className="font-black text-indigo-950">{money((court.stats?.bookingRevenue || 0) + (court.stats?.registrationRevenue || 0))}</span>
                                        <ChevronDownIcon className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {expanded && (
                                    <div className="space-y-6 border-t border-slate-100 bg-slate-50/50 p-5 sm:p-6">
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                            <MiniStat icon={CalendarDaysIcon} label="Bookings" value={court.stats?.bookings} />
                                            <MiniStat icon={CheckCircleIcon} label="Confirmed" value={court.stats?.confirmedBookings} />
                                            <MiniStat icon={BanknotesIcon} label="Booking Revenue" value={money(court.stats?.bookingRevenue)} />
                                            <MiniStat icon={TrophyIcon} label="Tournaments" value={court.stats?.tournaments} />
                                            <MiniStat icon={UserGroupIcon} label="Registrations" value={court.stats?.registrations} />
                                        </div>
                                        <div>
                                            <h4 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-700">Tournament Registrations</h4>
                                            {court.registrations?.length ? (
                                                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                                                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                                                        <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Tournament</th><th className="px-4 py-3">Player / Team</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {court.registrations.map((registration) => (
                                                                <tr key={registration._id}>
                                                                    <td className="px-4 py-3 font-bold text-slate-900">{registration.tournament?.name}</td>
                                                                    <td className="px-4 py-3 text-slate-600">{registration.teamName || registration.player?.name || [registration.player1?.name, registration.player2?.name].filter(Boolean).join(' & ') || 'Player'}</td>
                                                                    <td className="px-4 py-3 capitalize text-slate-600">{titleCase(registration.category)}</td>
                                                                    <td className="px-4 py-3 capitalize">{registration.paymentStatus}</td>
                                                                    <td className="px-4 py-3 text-right font-bold">{money(registration.paymentAmount)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : <p className="text-sm text-slate-500">No tournament registrations for this court yet.</p>}
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })
                )}
            </section>

            <section className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900">Received Bookings</h2>
                        <p className="mt-1 text-sm text-slate-500">Every reservation made for one of your courts, with payment details.</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-700">{bookings.length} total</span>
                </div>
                {loading ? (
                    <div className="flex justify-center py-16"><div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>
                ) : bookings.length === 0 ? (
                    <div className="px-6 py-16 text-center text-slate-500">No bookings received yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                            <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                <tr><th className="px-6 py-4">Court</th><th className="px-6 py-4">Player</th><th className="px-6 py-4">Schedule</th><th className="px-6 py-4">Booking</th><th className="px-6 py-4">Payment</th><th className="px-6 py-4 text-right">Amount</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-amber-50/30">
                                        <td className="px-6 py-4 font-bold text-slate-900">{booking.court?.name || 'Court removed'}</td>
                                        <td className="px-6 py-4 text-slate-600">{booking.user?.name || 'Player'}</td>
                                        <td className="px-6 py-4 text-slate-600">{new Date(booking.date).toLocaleDateString()}<br /><span className="text-xs text-slate-400">{booking.startTime} - {booking.endTime}</span></td>
                                        <td className="px-6 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${badgeClass(booking.status)}`}>{titleCase(booking.status)}</span></td>
                                        <td className="px-6 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${badgeClass(booking.paymentStatus)}`}>{booking.paymentStatus}</span></td>
                                        <td className="px-6 py-4 text-right font-black text-indigo-950">{money(booking.totalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-extrabold"><MapPinIcon className="h-5 w-5 text-amber-300" />Court Listings</h2>
                        <p className="mt-2 text-sm text-slate-300">{courts.length} published court{courts.length === 1 ? '' : 's'}. Edit pricing, photos, and availability from My Courts.</p>
                    </div>
                    <Link to="/org/courts" className="rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-bold text-white hover:bg-indigo-500">Manage My Courts</Link>
                </div>
            </section>
        </div>
    );
}

function MiniStat({ icon, label, value = 0 }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
            {createElement(icon, { className: 'mb-3 h-5 w-5 text-indigo-700' })}
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-black text-slate-900">{value || 0}</p>
        </div>
    );
}
