import { createElement, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRightIcon,
    BoltIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    PlusIcon,
    SparklesIcon,
    TrophyIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import courtService from '../../services/courtService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { formatSlotHour } from '../../utils/timeFormat';

const STATUS_BADGE = {
    confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    pending_payment: 'border-amber-200 bg-amber-50 text-amber-700',
    cancelled: 'border-slate-200 bg-slate-100 text-slate-600',
    completed: 'border-sky-200 bg-sky-50 text-sky-700'
};

const QUICK_ACTIONS = [
    {
        title: 'Book a court',
        description: 'Reserve a nearby venue',
        href: '/courts',
        icon: CalendarIcon,
        iconClass: 'bg-sky-100 text-sky-700',
        hoverClass: 'hover:border-sky-300 hover:bg-sky-50/70'
    },
    {
        title: 'Find a coach',
        description: 'Learn with an expert',
        href: '/coaches',
        icon: UserGroupIcon,
        iconClass: 'bg-lime-100 text-lime-700',
        hoverClass: 'hover:border-lime-300 hover:bg-lime-50/70'
    },
    {
        title: 'Find sparring',
        description: 'Meet your next opponent',
        href: '/app/sparring',
        icon: BoltIcon,
        iconClass: 'bg-violet-100 text-violet-700',
        hoverClass: 'hover:border-violet-300 hover:bg-violet-50/70'
    },
    {
        title: 'Join a tournament',
        description: 'Compete and track progress',
        href: '/tournaments',
        icon: TrophyIcon,
        iconClass: 'bg-amber-100 text-amber-700',
        hoverClass: 'hover:border-amber-300 hover:bg-amber-50/70'
    }
];

const formatStatus = (status) =>
    (status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

function StatTile({ icon, label, value, description, href, className, iconClassName }) {
    const content = (
        <div
            className={twMerge(
                'group h-full rounded-[1.5rem] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                className
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className={twMerge('flex h-11 w-11 items-center justify-center rounded-2xl', iconClassName)}>
                    {createElement(icon, { className: 'h-5 w-5' })}
                </div>
                {href && (
                    <ArrowRightIcon className="h-4 w-4 text-current opacity-45 transition-transform group-hover:translate-x-1" />
                )}
            </div>
            <p className="mt-5 text-3xl font-black tracking-tight">{value}</p>
            <p className="mt-1 text-sm font-bold">{label}</p>
            <p className="mt-1 text-xs font-medium leading-5 opacity-65">{description}</p>
        </div>
    );

    return href ? (
        <Link to={href} className="block h-full">
            {content}
        </Link>
    ) : content;
}

export default function PlayerDashboard() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            setFetchError(false);
            const data = await courtService.getMyBookings();
            const bookings = Array.isArray(data?.data) ? data.data : [];
            setUpcomingBookings(
                bookings.map((booking) => ({
                    id: booking._id,
                    court: booking.court?.name || 'Court',
                    date: new Date(booking.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    }),
                    time: formatSlotHour(booking.startTime),
                    status: booking.status
                }))
            );
        } catch {
            setFetchError(true);
            addToast('Could not load your bookings.', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const firstName = user?.name?.split(' ')[0] || 'Player';
    const bookingCount = loading ? '-' : upcomingBookings.length;

    return (
        <div className="min-h-[calc(100vh-12rem)] space-y-6 pb-10">
            <header className="relative isolate overflow-hidden rounded-[2rem] bg-brand-navy-deep px-6 py-7 text-white shadow-xl shadow-brand-navy/15 sm:px-9 sm:py-9">
                <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-sky/20 blur-3xl" aria-hidden />
                <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-brand-lime/15 blur-3xl" aria-hidden />
                <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full border border-white/10 lg:block" aria-hidden />
                <div className="absolute right-16 top-16 hidden h-16 w-16 rounded-full border border-brand-lime/30 lg:block" aria-hidden />

                <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-sky-100 backdrop-blur-sm">
                            <SparklesIcon className="h-4 w-4 text-brand-lime" />
                            Player hub
                        </div>
                        <p className="mt-5 text-sm font-semibold text-sky-200">Welcome back, {firstName}</p>
                        <h1 className="mt-2 max-w-xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                            Make your next game happen.
                        </h1>
                        <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-slate-300 sm:text-base">
                            Book venues, meet players, train with coaches, and keep every activity in one place.
                        </p>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <Link
                                to="/courts"
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-lime px-6 text-sm font-black text-brand-navy-deep shadow-lg shadow-brand-lime/10 transition-colors hover:bg-lime-300 sm:w-auto"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Book a court
                            </Link>
                            <Link
                                to="/app/sparring"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-bold text-white transition-colors hover:bg-white/15"
                            >
                                <MagnifyingGlassIcon className="h-5 w-5 text-brand-sky" />
                                Find a player
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-lime">Your game plan</p>
                                <p className="mt-1 text-lg font-black">Everything starts here</p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-sky/15 text-brand-sky">
                                <BoltIcon className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-5 space-y-3">
                            {['Reserve the right venue', 'Connect with players and coaches', 'Track bookings and competitions'].map((item) => (
                                <div key={item} className="flex items-center gap-3 rounded-xl bg-brand-navy/55 px-3.5 py-3">
                                    <CheckCircleIcon className="h-5 w-5 shrink-0 text-brand-lime" />
                                    <span className="text-sm font-semibold text-slate-100">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <section aria-label="Player activity summary" className="grid gap-4 sm:grid-cols-3">
                <StatTile
                    icon={CalendarIcon}
                    label="Court bookings"
                    value={bookingCount}
                    description="Your reservations in one place"
                    href="/app/bookings"
                    className="border-sky-200 bg-gradient-to-br from-sky-50 to-white text-brand-navy-deep"
                    iconClassName="bg-brand-sky text-brand-navy-deep"
                />
                <StatTile
                    icon={UserGroupIcon}
                    label="Sparring requests"
                    value="0"
                    description="Find a player at your level"
                    href="/app/sparring"
                    className="border-brand-navy bg-brand-navy text-white shadow-brand-navy/15"
                    iconClassName="bg-white/10 text-brand-lime"
                />
                <StatTile
                    icon={TrophyIcon}
                    label="Tournament entries"
                    value="0"
                    description="Challenge yourself in an event"
                    href="/app/registrations"
                    className="border-lime-200 bg-gradient-to-br from-lime-50 to-white text-brand-navy-deep"
                    iconClassName="bg-brand-lime text-brand-navy-deep"
                />
            </section>

            <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
                <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-sky-50/90 to-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Your schedule</p>
                            <h2 className="mt-1 flex items-center gap-2 text-xl font-black text-brand-navy-deep">
                                <ClockIcon className="h-5 w-5 text-brand-sky" />
                                Upcoming bookings
                            </h2>
                        </div>
                        <Link
                            to="/app/bookings"
                            className="inline-flex items-center gap-1.5 text-sm font-black text-brand-navy transition-colors hover:text-sky-700"
                        >
                            View all
                            <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="min-h-[360px] p-5 sm:p-6">
                        {loading ? (
                            <TableSkeleton rows={3} />
                        ) : fetchError ? (
                            <div className="flex min-h-[310px] flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 px-6 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                    <ExclamationTriangleIcon className="h-7 w-7" />
                                </div>
                                <p className="mt-4 font-black text-brand-navy-deep">Could not load bookings</p>
                                <p className="mt-1 max-w-sm text-sm font-medium text-slate-600">Try again to refresh your player schedule.</p>
                                <Button
                                    onClick={fetchBookings}
                                    variant="outline"
                                    className="mt-5 rounded-xl border-amber-300 bg-white font-black text-brand-navy-deep hover:bg-amber-100"
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : upcomingBookings.length > 0 ? (
                            <div className="flex min-h-[310px] flex-col">
                                <ul className="space-y-3">
                                    {upcomingBookings.map((booking) => (
                                        <li
                                            key={booking.id}
                                            className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-sky-300 hover:bg-sky-50/60 sm:flex-row sm:items-center"
                                        >
                                            <div className="flex min-w-0 items-center gap-3.5">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-navy text-brand-sky shadow-sm">
                                                    <MapPinIcon className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-black text-brand-navy-deep">{booking.court}</p>
                                                    <p className="mt-1 text-sm font-medium text-slate-600">
                                                        {booking.date} <span className="text-slate-300">|</span> {booking.time}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={twMerge(
                                                    'w-fit rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider',
                                                    STATUS_BADGE[booking.status] || STATUS_BADGE.pending
                                                )}
                                            >
                                                {formatStatus(booking.status)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto flex flex-col gap-4 rounded-2xl bg-brand-navy-deep p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-black">Plan another game</p>
                                        <p className="mt-1 text-xs font-medium text-slate-300">Keep your week active with another court or sparring match.</p>
                                    </div>
                                    <Link
                                        to="/courts"
                                        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-black text-brand-lime transition-colors hover:text-lime-300"
                                    >
                                        Browse courts
                                        <ArrowRightIcon className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="grid min-h-[310px] place-items-center rounded-2xl border border-dashed border-sky-300 bg-gradient-to-br from-sky-50 via-white to-lime-50 p-6 text-center">
                                <div>
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-navy text-brand-sky shadow-lg shadow-brand-navy/15">
                                        <CalendarIcon className="h-8 w-8" />
                                    </div>
                                    <h3 className="mt-5 text-xl font-black text-brand-navy-deep">Your schedule is open</h3>
                                    <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-slate-600">
                                        Choose a court and time that works for you. Your next reservation will appear here.
                                    </p>
                                    <Link
                                        to="/courts"
                                        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 text-sm font-black text-white shadow-lg shadow-brand-navy/15 transition-colors hover:bg-brand-navy-deep"
                                    >
                                        Browse courts
                                        <ArrowRightIcon className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="flex flex-col gap-6">
                    <section className="flex-1 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-700">Explore</p>
                                <h2 className="mt-1 text-xl font-black text-brand-navy-deep">Keep moving</h2>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-100 text-lime-700">
                                <BoltIcon className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            {QUICK_ACTIONS.map((action) => {
                                return (
                                    <Link
                                        key={action.title}
                                        to={action.href}
                                        className={twMerge(
                                            'group flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5 transition-all',
                                            action.hoverClass
                                        )}
                                    >
                                        <div className={twMerge('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', action.iconClass)}>
                                            {createElement(action.icon, { className: 'h-5 w-5' })}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-brand-navy-deep">{action.title}</p>
                                            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{action.description}</p>
                                        </div>
                                        <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                );
                            })}
                        </div>
                    </section>

                    <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-sky to-sky-300 p-6 text-brand-navy-deep shadow-lg shadow-sky-200/60">
                        <div className="absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-white/25" aria-hidden />
                        <div className="relative">
                            <TrophyIcon className="h-8 w-8" />
                            <h2 className="mt-4 text-xl font-black">Ready to compete?</h2>
                            <p className="mt-2 text-sm font-semibold leading-6 text-brand-navy/80">
                                Discover tournaments, register, and manage every entry from your dashboard.
                            </p>
                            <Link
                                to="/app/registrations"
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-navy-deep px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-brand-navy"
                            >
                                My registrations
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}
