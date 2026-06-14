import { createElement, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getMyRegistrations } from '../../services/tournamentService';
import courtService from '../../services/courtService';
import * as professionalService from '../../services/professionalService';
import LoadingSpinner from '../../components/LoadingSpinner';
import RequestCard from '../../components/professional/RequestCard';
import {
    AcademicCapIcon,
    ArrowRightIcon,
    BoltIcon,
    CalendarDaysIcon,
    CalendarIcon,
    CheckBadgeIcon,
    ChevronRightIcon,
    ClockIcon,
    FireIcon,
    InboxIcon,
    MapPinIcon,
    TrophyIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (value, options = {}) => {
    if (!value) return 'Date to be announced';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date to be announced';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options
    });
};

const titleCase = (value = '') => value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());

const registrationBadge = (status) => {
    if (status === 'confirmed') return 'border-lime-200 bg-lime-50 text-lime-800';
    if (status === 'cancelled' || status === 'rejected') return 'border-rose-200 bg-rose-50 text-rose-700';
    return 'border-amber-200 bg-amber-50 text-amber-800';
};

const MetricCard = ({ icon, label, value, detail, accent }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-200">
                {createElement(icon, { className: 'h-5 w-5' })}
            </div>
        </div>
    </div>
);

const EmptyPanel = ({ icon, title, description, href, action }) => (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
            {createElement(icon, { className: 'h-6 w-6' })}
        </div>
        <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">{description}</p>
        <Link to={href} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900">
            {action} <ArrowRightIcon className="h-4 w-4" />
        </Link>
    </div>
);

const QuickLink = ({ icon, title, description, href, tone = 'sky' }) => {
    const tones = {
        sky: 'bg-sky-50 text-sky-700 group-hover:bg-sky-100',
        lime: 'bg-lime-50 text-lime-700 group-hover:bg-lime-100',
        amber: 'bg-amber-50 text-amber-700 group-hover:bg-amber-100'
    };

    return (
        <Link
            to={href}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md"
        >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${tones[tone]}`}>
                {createElement(icon, { className: 'h-5 w-5' })}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{description}</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
        </Link>
    );
};

const ProfessionalDashboard = () => {
    const { user } = useAuth();
    const { error: showError } = useToast();
    const [registrations, setRegistrations] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const canReceiveRequests = user?.verified &&
                    (user?.skillLevel === 'professional' || user?.role === 'coach');
                const tasks = [
                    getMyRegistrations().catch(() => ({ data: [] })),
                    courtService.getMyBookings().catch(() => ({ data: [] }))
                ];

                if (canReceiveRequests) {
                    tasks.push(professionalService.getIncomingRequests().catch(() => ({ data: [] })));
                }

                const [registrationResult, bookingResult, requestResult = { data: [] }] = await Promise.all(tasks);
                setRegistrations(Array.isArray(registrationResult?.data) ? registrationResult.data : []);
                setBookings(Array.isArray(bookingResult?.data) ? bookingResult.data : []);
                setRequests(Array.isArray(requestResult?.data) ? requestResult.data : []);
            } catch (err) {
                console.error('Error fetching professional dashboard:', err);
                showError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [showError, user]);

    const dashboard = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingBookings = bookings
            .filter(booking => new Date(booking.date).getTime() >= today.getTime())
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const activeTournaments = registrations
            .filter(registration => ['registration_open', 'registration_closed', 'in_progress']
                .includes(registration.tournament?.status))
            .sort((a, b) => new Date(a.tournament?.startDate) - new Date(b.tournament?.startDate));

        const pendingRequests = requests.filter(request => request.status === 'PENDING_RESPONSE');
        const nextBooking = upcomingBookings[0];
        const nextTournament = activeTournaments[0];
        const bookingDate = nextBooking ? new Date(nextBooking.date) : null;
        const tournamentDate = nextTournament ? new Date(nextTournament.tournament?.startDate) : null;

        let nextCommitment = null;
        if (bookingDate && (!tournamentDate || bookingDate <= tournamentDate)) {
            nextCommitment = {
                type: 'Court session',
                title: nextBooking.court?.name || 'Court booking',
                date: nextBooking.date,
                time: nextBooking.startTime,
                location: nextBooking.court?.location?.area || nextBooking.court?.location?.city,
                href: '/pro/bookings'
            };
        } else if (nextTournament) {
            nextCommitment = {
                type: 'Tournament',
                title: nextTournament.tournament?.name || 'Upcoming tournament',
                date: nextTournament.tournament?.startDate,
                location: nextTournament.tournament?.venue?.name || nextTournament.tournament?.location,
                href: '/pro/registrations'
            };
        }

        return { upcomingBookings, activeTournaments, pendingRequests, nextCommitment, today };
    }, [bookings, registrations, requests]);

    const handleStatusChange = (id, newStatus) => {
        setRequests(current => current.map(request =>
            request._id === id ? { ...request, status: newStatus } : request
        ));
    };

    if (loading) return <LoadingSpinner />;

    const firstName = user?.name?.trim().split(/\s+/)[0] || 'Player';
    const { upcomingBookings, activeTournaments, pendingRequests, nextCommitment, today } = dashboard;
    const nextEventDays = nextCommitment
        ? Math.max(0, Math.ceil((new Date(nextCommitment.date) - today) / DAY_MS))
        : null;

    return (
        <div className="mx-auto max-w-[1440px] space-y-6 pb-10">
            <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.20),transparent_32%),radial-gradient(circle_at_15%_90%,rgba(163,230,53,0.12),transparent_28%)]" />
                <div className="absolute right-8 top-0 h-32 w-32 rounded-full border border-white/10" />
                <div className="absolute right-20 top-12 h-32 w-32 rounded-full border border-white/5" />

                <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.65fr] lg:p-10">
                    <div className="flex flex-col justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                                    user?.verified
                                        ? 'border-lime-300/20 bg-lime-300/10 text-lime-200'
                                        : 'border-amber-300/20 bg-amber-300/10 text-amber-200'
                                }`}>
                                    <CheckBadgeIcon className="h-4 w-4" />
                                    {user?.verified ? 'Verified professional' : 'Verification pending'}
                                </span>
                                {pendingRequests.length > 0 && (
                                    <Link to="/pro/requests" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-sky-100 transition hover:bg-white/15">
                                        {pendingRequests.length} request{pendingRequests.length === 1 ? '' : 's'} waiting
                                    </Link>
                                )}
                            </div>
                            <p className="mt-7 text-sm font-semibold text-sky-200">Welcome back, {firstName}</p>
                            <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                                Your competitive week, clearly organized.
                            </h1>
                            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                                Keep court time, tournament entries, and sparring requests moving from one focused workspace.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link to="/pro/availability" className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-lime-200">
                                <BoltIcon className="h-5 w-5" /> Manage availability
                            </Link>
                            <Link to="/tournaments" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                                Browse tournaments <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">Next commitment</p>
                                <p className="mt-1 text-xs text-slate-400">Your nearest scheduled activity</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-200">
                                <CalendarDaysIcon className="h-5 w-5" />
                            </div>
                        </div>

                        {nextCommitment ? (
                            <div className="mt-7">
                                <p className="text-xs font-bold uppercase tracking-wider text-lime-200">{nextCommitment.type}</p>
                                <h2 className="mt-2 text-xl font-extrabold leading-tight text-white">{nextCommitment.title}</h2>
                                <div className="mt-5 space-y-2.5 text-sm text-slate-300">
                                    <p className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-sky-300" /> {formatDate(nextCommitment.date, { weekday: 'short' })}</p>
                                    {nextCommitment.time && <p className="flex items-center gap-2"><ClockIcon className="h-4 w-4 text-sky-300" /> {nextCommitment.time}</p>}
                                    {nextCommitment.location && <p className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-sky-300" /> {nextCommitment.location}</p>}
                                </div>
                                <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
                                    <div>
                                        <p className="text-3xl font-black text-white">{nextEventDays}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">day{nextEventDays === 1 ? '' : 's'} away</p>
                                    </div>
                                    <Link to={nextCommitment.href} className="inline-flex items-center gap-1 text-sm font-bold text-sky-200 hover:text-white">
                                        View details <ChevronRightIcon className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
                                <p className="text-sm font-bold text-white">Your calendar is open</p>
                                <p className="mt-2 text-xs leading-5 text-slate-400">Book court time or enter a tournament to build your next training block.</p>
                                <Link to="/courts" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-lime-200 hover:text-lime-100">
                                    Book a court <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={TrophyIcon} label="Active events" value={activeTournaments.length} detail="Tournament entries in motion" accent="bg-sky-500" />
                <MetricCard icon={CalendarIcon} label="Court sessions" value={upcomingBookings.length} detail="Upcoming reservations" accent="bg-lime-400" />
                <MetricCard icon={InboxIcon} label="Needs response" value={pendingRequests.length} detail="Open sparring requests" accent="bg-amber-400" />
                <MetricCard icon={AcademicCapIcon} label="Player tier" value="PRO" detail={user?.verified ? 'Identity verified' : 'Verification pending'} accent="bg-violet-500" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
                <div className="space-y-6">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Training calendar</p>
                                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Upcoming court sessions</h2>
                                <p className="mt-1 text-sm text-slate-500">Your next reservations, ordered by date.</p>
                            </div>
                            <Link to="/pro/bookings" className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-sky-700">
                                All bookings <ChevronRightIcon className="h-4 w-4" />
                            </Link>
                        </div>

                        {upcomingBookings.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {upcomingBookings.slice(0, 4).map((booking, index) => (
                                    <div key={booking._id} className="grid gap-4 py-5 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
                                        <div className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-2xl bg-slate-950 text-white">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-300">
                                                {formatDate(booking.date, { month: 'short', year: undefined }).split(' ')[0]}
                                            </span>
                                            <span className="text-2xl font-black leading-none">{new Date(booking.date).getDate()}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate font-extrabold text-slate-950">{booking.court?.name || 'Court booking'}</h3>
                                                {index === 0 && <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-lime-800">Next</span>}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                                                <span className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4 text-sky-600" /> {booking.startTime}{booking.endTime ? ` - ${booking.endTime}` : ''}</span>
                                                <span className="flex items-center gap-1.5"><MapPinIcon className="h-4 w-4 text-sky-600" /> {booking.court?.location?.area || booking.court?.location?.city || 'Venue details'}</span>
                                            </div>
                                        </div>
                                        <Link to="/pro/bookings" aria-label="View court booking" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
                                            <ChevronRightIcon className="h-5 w-5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="pt-5">
                                <EmptyPanel icon={CalendarIcon} title="No court sessions scheduled" description="Reserve focused court time and keep your weekly training rhythm visible here." href="/courts" action="Book a court" />
                            </div>
                        )}
                    </div>

                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-700">Competition</p>
                                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Tournament campaign</h2>
                                <p className="mt-1 text-sm text-slate-500">Registration status and upcoming event dates.</p>
                            </div>
                            <Link to="/pro/registrations" className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-sky-700">
                                All entries <ChevronRightIcon className="h-4 w-4" />
                            </Link>
                        </div>

                        {registrations.length > 0 ? (
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                {registrations.slice(0, 4).map(registration => (
                                    <Link
                                        key={registration._id}
                                        to="/pro/registrations"
                                        className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-sky-200 hover:bg-sky-50/60"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm ring-1 ring-slate-200 group-hover:ring-sky-200">
                                                <TrophyIcon className="h-5 w-5" />
                                            </div>
                                            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${registrationBadge(registration.status)}`}>
                                                {titleCase(registration.status || 'pending')}
                                            </span>
                                        </div>
                                        <h3 className="mt-4 line-clamp-2 min-h-10 text-sm font-extrabold leading-5 text-slate-950">{registration.tournament?.name || 'Tournament entry'}</h3>
                                        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-sky-700">{titleCase(registration.category || 'Open category')}</p>
                                        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><CalendarIcon className="h-4 w-4" /> {formatDate(registration.tournament?.startDate)}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="pt-5">
                                <EmptyPanel icon={TrophyIcon} title="No tournament entries yet" description="Find an event that matches your category and add a clear competitive target to your calendar." href="/tournaments" action="Explore tournaments" />
                            </div>
                        )}
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Player workspace</p>
                        <h2 className="mt-1 text-lg font-black text-slate-950">Move your week forward</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Direct access to the tasks a professional player uses most.</p>
                        <div className="mt-5 space-y-3">
                            <QuickLink icon={BoltIcon} title="Sparring availability" description="Open your next match slots" href="/pro/availability" tone="lime" />
                            <QuickLink icon={UserGroupIcon} title="Matching requests" description={`${pendingRequests.length} waiting for a response`} href="/pro/requests" tone="sky" />
                            <QuickLink icon={AcademicCapIcon} title="Coaching support" description="Find specialist coaching" href="/coaches" tone="amber" />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-900 p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
                        <div className="flex items-center justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-300 text-slate-950">
                                <FireIcon className="h-6 w-6" />
                            </div>
                            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">This week</span>
                        </div>
                        <h2 className="mt-6 text-xl font-black">Build a balanced match week.</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">Pair court time with recovery, focused coaching, and one competitive session instead of filling every open slot.</p>
                        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                            <div>
                                <p className="text-2xl font-black text-lime-200">{upcomingBookings.length}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Court sessions</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-sky-200">{activeTournaments.length}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active events</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Action required</p>
                        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Incoming sparring requests</h2>
                        <p className="mt-1 text-sm text-slate-500">Respond quickly so players can finalize their schedule.</p>
                    </div>
                    <Link to="/pro/requests" className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-sky-700">
                        Request inbox <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                </div>

                {pendingRequests.length > 0 ? (
                    <div className="mt-6 grid gap-5 xl:grid-cols-2">
                        {pendingRequests.slice(0, 2).map(request => (
                            <RequestCard key={request._id} request={request} onStatusChange={handleStatusChange} />
                        ))}
                    </div>
                ) : (
                    <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-lime-200 bg-white p-5 sm:flex-row sm:items-center">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-100 text-lime-700">
                                <CheckBadgeIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-950">You are all caught up</h3>
                                <p className="mt-1 text-sm text-slate-500">There are no sparring requests waiting for your response.</p>
                            </div>
                        </div>
                        <Link to="/pro/availability" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
                            Update availability <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ProfessionalDashboard;
