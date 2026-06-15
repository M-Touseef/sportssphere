import { createElement, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRightIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ClockIcon,
    MapPinIcon,
    PlusIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';
import courtService from '../../services/courtService';

const money = (amount = 0) => `Rs. ${Number(amount || 0).toLocaleString()}`;

const MetricCard = ({ icon, label, value, detail, accent }) => (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
        <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
        <div className="flex items-start justify-between gap-4">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs font-medium text-slate-500">{detail}</p></div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-200">{createElement(icon, { className: 'h-5 w-5' })}</div>
        </div>
    </div>
);

export default function OrganizerDashboard() {
    const [overview, setOverview] = useState({ stats: {}, bookings: [], courts: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        courtService.getOwnerOverview()
            .then(res => { if (!cancelled && res?.data) setOverview(res.data); })
            .catch(error => console.error('Error loading owner overview:', error))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const { stats = {}, courts = [], bookings = [] } = overview;
    const recentBookings = useMemo(() => bookings.slice(0, 5), [bookings]);
    const display = value => loading ? '...' : String(value || 0);

    return (
        <div className="mx-auto max-w-[1440px] space-y-6 pb-10">
            <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.2),transparent_32%),radial-gradient(circle_at_15%_90%,rgba(163,230,53,0.12),transparent_28%)]" />
                <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.65fr] lg:p-10">
                    <div>
                        <span className="inline-flex rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-lime-200">Organizer workspace</span>
                        <p className="mt-7 text-sm font-semibold text-sky-200">Venue and event operations</p>
                        <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">Run every court and tournament from one clear view.</h1>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Track venue performance, booking revenue, payment status, and tournament activity without losing sight of the next action.</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link to="/org/courts/create" className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-lime-200"><PlusIcon className="h-5 w-5" /> Add court</Link>
                            <Link to="/app/tournaments/create" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Create tournament <ArrowRightIcon className="h-4 w-4" /></Link>
                        </div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">Revenue pulse</p><p className="mt-1 text-xs text-slate-400">Payments across your venues</p></div><BanknotesIcon className="h-6 w-6 text-lime-200" /></div>
                        <p className="mt-8 text-4xl font-black">{loading ? '...' : money(stats.paidAmount)}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-lime-200">received</p>
                        <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                            <div><p className="text-xs text-slate-400">Pending</p><p className="mt-1 font-black">{loading ? '...' : money(stats.pendingAmount)}</p></div>
                            <div><p className="text-xs text-slate-400">Confirmed bookings</p><p className="mt-1 font-black">{display(stats.confirmedBookings)}</p></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={BuildingOffice2Icon} label="Published courts" value={display(stats.courts)} detail="Active venue listings" accent="bg-sky-500" />
                <MetricCard icon={CalendarDaysIcon} label="Bookings received" value={display(stats.bookings)} detail="All venue reservations" accent="bg-lime-400" />
                <MetricCard icon={CheckCircleIcon} label="Confirmed" value={display(stats.confirmedBookings)} detail="Ready for play" accent="bg-violet-500" />
                <MetricCard icon={ClockIcon} label="Payment pending" value={loading ? '...' : money(stats.pendingAmount)} detail="Still to be collected" accent="bg-amber-400" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Venue performance</p><h2 className="mt-1 text-xl font-black text-slate-950">Court portfolio</h2><p className="mt-1 text-sm text-slate-500">Bookings, events, and revenue by listing.</p></div><Link to="/org/courts" className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-sky-700">All courts <ChevronRightIcon className="h-4 w-4" /></Link></div>
                    {courts.length ? <div className="divide-y divide-slate-100">{courts.slice(0, 5).map(court => (
                        <article key={court._id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                            <div><h3 className="font-extrabold text-slate-950">{court.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPinIcon className="h-4 w-4 text-sky-600" />{court.location?.area || court.location?.city || 'Lahore'}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide"><span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">{court.stats?.bookings || 0} bookings</span><span className="rounded-full bg-lime-50 px-2.5 py-1 text-lime-700">{court.stats?.tournaments || 0} events</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{money((court.stats?.bookingRevenue || 0) + (court.stats?.registrationRevenue || 0))}</span></div></div>
                            <Link to={`/org/courts/${court._id}/details`} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-900"><ChartBarIcon className="h-4 w-4" /> View details</Link>
                        </article>
                    ))}</div> : <div className="py-14 text-center text-sm text-slate-500">Add your first court to start tracking venue activity.</div>}
                </div>

                <aside className="space-y-6">
                    <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">Organizer toolkit</p><h2 className="mt-2 text-xl font-black">Keep operations moving.</h2><div className="mt-6 space-y-3"><QuickLink icon={BuildingOffice2Icon} title="Manage courts" href="/org/courts" /><QuickLink icon={TrophyIcon} title="My tournaments" href="/app/tournaments" /><QuickLink icon={PlusIcon} title="Create event" href="/app/tournaments/create" /></div></div>
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Recent activity</p><h2 className="mt-1 text-lg font-black text-slate-950">Booking queue</h2>{recentBookings.length ? <div className="mt-4 space-y-3">{recentBookings.map(booking => <div key={booking._id} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-bold text-slate-900">{booking.court?.name || 'Court booking'}</p><p className="mt-1 text-xs text-slate-500">{booking.user?.name || 'Player'} - {booking.status || 'pending'}</p></div>)}</div> : <p className="mt-4 text-sm leading-6 text-slate-500">New venue bookings will appear here.</p>}</div>
                </aside>
            </section>
        </div>
    );
}

const QuickLink = ({ icon, title, href }) => <Link to={href} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-200">{createElement(icon, { className: 'h-5 w-5' })}</span><span className="flex-1 text-sm font-bold">{title}</span><ChevronRightIcon className="h-4 w-4 text-slate-400 group-hover:text-white" /></Link>;
