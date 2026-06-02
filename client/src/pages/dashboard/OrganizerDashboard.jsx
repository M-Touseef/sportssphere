import { createElement, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BanknotesIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    MapPinIcon,
    PlusIcon,
    ChartBarIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';
import StatTile from '../../components/ui/StatTile';
import courtService from '../../services/courtService';

const money = (amount = 0) => `Rs. ${Number(amount).toLocaleString()}`;

export default function OrganizerDashboard() {
    const [overview, setOverview] = useState({ stats: {}, bookings: [], courts: [] });
    const [loading, setLoading] = useState(true);

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

    const { stats, courts } = overview;
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
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {courts.map((court) => (
                            <article key={court._id} className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm transition hover:border-amber-200 hover:shadow-md sm:p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900">{court.name}</h3>
                                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPinIcon className="h-4 w-4" />{court.location?.address}, {court.location?.area || 'Lahore'}, Lahore</p>
                                    </div>
                                    <Link to={`/org/courts/${court._id}/details`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-950 px-4 py-2.5 text-sm font-bold text-amber-50 hover:bg-indigo-900">
                                        <ChartBarIcon className="h-4 w-4" />
                                        Details
                                    </Link>
                                </div>
                                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                    <MiniStat icon={CalendarDaysIcon} label="Bookings" value={court.stats?.bookings} />
                                    <MiniStat icon={TrophyIcon} label="Tournaments" value={court.stats?.tournaments} />
                                    <MiniStat icon={BanknotesIcon} label="Revenue" value={money((court.stats?.bookingRevenue || 0) + (court.stats?.registrationRevenue || 0))} />
                                </div>
                            </article>
                        ))}
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
