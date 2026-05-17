import { Link, useLocation } from 'react-router-dom'
import {
    HomeIcon,
    CalendarIcon,
    UsersIcon,
    TrophyIcon,
    Cog6ToothIcon,
    ChartBarIcon,
    XMarkIcon,
    MapPinIcon,
    SparklesIcon,
    DevicePhoneMobileIcon,
    IdentificationIcon,
    FireIcon,
    AcademicCapIcon,
    ClockIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { twMerge } from 'tailwind-merge'

export default function Sidebar({ user, onCloseMobile, isMobile = false }) {
    const location = useLocation()
    const userRoleLabel = user?.role === 'player'
        ? (user?.skillLevel === 'professional' ? 'Professional Player' : 'Non-Professional Player')
        : user?.role;

    let navigation = [
        {
            name: user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard',
            href: user?.role === 'admin' ? '/admin/dashboard' : '/app',
            icon: user?.role === 'admin' ? ChartBarIcon : HomeIcon
        },
    ];

    // Role-specific Navigation
    if (user?.role === 'admin') {
        // No extra admin dashboard link needed as it's merged into the main dashboard link
    } else if (user?.role === 'organizer') {
        navigation.push({ name: 'My Tournaments', href: '/app/tournaments', icon: FireIcon });
        navigation.push({ name: 'Create Tournament', href: '/app/tournaments/create', icon: TrophyIcon });
        navigation.push({ name: 'My Courts', href: '/org/courts', icon: MapPinIcon });
    } else if (user?.role === 'player') {
        navigation.push({ name: 'Book a Court', href: '/courts', icon: MapPinIcon });
        navigation.push({ name: 'Find Mentors', href: '/coaches', icon: AcademicCapIcon });
        navigation.push({ name: 'Tournaments', href: '/tournaments', icon: TrophyIcon });
        navigation.push({ name: 'My Schedule', href: '/app/bookings', icon: CalendarIcon });
        navigation.push({ name: 'Coaching Sessions', href: '/app/sessions', icon: ClockIcon });

        if (user.skillLevel === 'professional') {
            navigation.push({ name: 'Sparring Manager', href: '/app/sparring', icon: UsersIcon });
            navigation.push({ name: 'Sparring Invites', href: '/app/sparring/requests', icon: CalendarIcon });
            navigation.push({ name: 'My Registrations', href: '/pro/registrations', icon: FireIcon });
        } else {
            navigation.push({ name: 'Find Players', href: '/app/sparring', icon: UsersIcon });
            navigation.push({ name: 'Sparring Invites', href: '/app/sparring/requests', icon: CalendarIcon });
            navigation.push({ name: 'My Registrations', href: '/app/registrations', icon: FireIcon });
        }
    } else if (user?.role === 'coach') {
        // Coaches should primarily use /coach dashboard, but providing links here just in case they land on Main Dashboard
        navigation.push({ name: 'Requests', href: '/coach/requests', icon: UsersIcon });
        navigation.push({ name: 'Availability', href: '/coach/availability', icon: CalendarIcon });
    }

    const secondaryNav = []

    return (
        <div className="flex h-full grow flex-col gap-y-10 overflow-y-auto border-r border-indigo-100/70 bg-gradient-to-b from-white via-indigo-50/40 to-violet-50/50 px-6 sm:px-8 pb-10 shadow-[10px_0_60px_-20px_rgba(79,70,229,0.22)]">
            <div className="flex h-24 shrink-0 items-center justify-between">
                <Link to="/" className="flex items-center gap-3.5 group">
                    <motion.div
                        whileHover={{ rotate: 10, scale: 1.06 }}
                        className="h-11 w-11 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 transition-transform duration-500"
                    >
                        <TrophyIcon className="h-6 w-6" />
                    </motion.div>
                    <span className="text-xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-violet-600 to-cyan-600 group-hover:from-indigo-600 group-hover:to-violet-500 transition-all duration-500">
                        SportsSphere
                    </span>
                </Link>
                {isMobile && (
                    <button onClick={onCloseMobile} className="lg:hidden p-2.5 text-slate-400 hover:text-indigo-700 hover:bg-white rounded-xl transition-all border border-indigo-100/80">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                )}
            </div>

            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-12">
                    <li>
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-6 flex items-center gap-3">
                            Main Menu
                            <div className="h-px flex-1 bg-gradient-to-r from-indigo-200/70 to-transparent" />
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        </div>
                        <ul role="list" className="space-y-2">
                            {navigation.map((item) => {
                                const isActive =
                                    location.pathname === item.href ||
                                    (item.href === '/tournaments' && location.pathname.startsWith('/tournaments'));
                                return (
                                    <li key={item.name}>
                                        <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 380, damping: 28 }}>
                                            <Link
                                                to={item.href}
                                                onClick={onCloseMobile}
                                                className={twMerge(
                                                    "group flex gap-x-4 rounded-2xl p-4 text-[13px] font-bold leading-none transition-all duration-300 relative",
                                                    isActive
                                                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-200/80"
                                                        : "text-slate-500 hover:text-indigo-700 hover:bg-white/90 hover:shadow-md hover:shadow-indigo-100/60"
                                                )}
                                            >
                                                <item.icon className={twMerge(
                                                    "h-5 w-5 shrink-0 transition-all duration-300",
                                                    isActive ? "text-white" : "text-indigo-300 group-hover:text-indigo-600 group-hover:-translate-y-0.5"
                                                )} />
                                                {item.name}
                                                {isActive && (
                                                    <>
                                                        <motion.div
                                                            layoutId="sidebar-active"
                                                            className="absolute -left-8 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-indigo-600 rounded-r-full"
                                                        />
                                                        <motion.div
                                                            initial={{ opacity: 0.3 }}
                                                            animate={{ opacity: 0.85 }}
                                                            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.1 }}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/90"
                                                        />
                                                    </>
                                                )}
                                            </Link>
                                        </motion.div>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>

                    <li>
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-6 flex items-center gap-3">
                            Account
                            <div className="h-px flex-1 bg-gradient-to-r from-indigo-200/70 to-transparent" />
                        </div>
                        <ul role="list" className="space-y-2">
                            {secondaryNav.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <li key={item.name}>
                                        <Link
                                            to={item.href}
                                            onClick={onCloseMobile}
                                            className={twMerge(
                                                "group flex gap-x-4 rounded-2xl p-4 text-[13px] font-bold leading-none transition-all duration-300",
                                                isActive
                                                    ? "bg-slate-900 text-white shadow-2xl shadow-slate-200"
                                                    : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                                            )}
                                        >
                                            <item.icon className={twMerge(
                                                "h-5 w-5 shrink-0 transition-colors",
                                                isActive ? "text-white" : "text-slate-300 group-hover:text-indigo-600"
                                            )} />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>

                    <li className="mt-auto pt-8 border-t border-indigo-100/70">
                        {user?.role === 'admin' ? (
                            <div className="flex items-center gap-x-4 p-4 rounded-3xl bg-white/70 border border-indigo-100/70 backdrop-blur-sm">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-100 flex items-center justify-center text-slate-900 font-black shadow-inner border border-white">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[13px] font-black text-slate-900 truncate">{user?.name}</span>
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest truncate">
                                        {userRoleLabel}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <Link to="/app/profile" className="flex items-center gap-x-4 p-4 rounded-3xl border border-transparent hover:border-indigo-100 hover:bg-white/80 transition-all group">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-100 flex items-center justify-center text-slate-900 font-black shadow-inner border border-white group-hover:scale-110 group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white transition-all duration-500">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[13px] font-black text-slate-900 truncate leading-none mb-2">{user?.name}</span>
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest truncate">
                                        {userRoleLabel}
                                    </span>
                                </div>
                            </Link>
                        )}
                    </li>
                </ul>
            </nav>
        </div>
    )
}
