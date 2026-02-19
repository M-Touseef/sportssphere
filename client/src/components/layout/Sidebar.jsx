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
        navigation.push({ name: 'My Schedule', href: '/app/bookings', icon: CalendarIcon });
        navigation.push({ name: 'Coaching Sessions', href: '/app/sessions', icon: ClockIcon });

        if (user.skillLevel === 'professional') {
            navigation.push({ name: 'Sparring Manager', href: '/app/sparring', icon: UsersIcon });
            navigation.push({ name: 'Sparring Invites', href: '/app/sparring/requests', icon: CalendarIcon });
            navigation.push({ name: 'My Tournaments', href: '/app/tournaments', icon: FireIcon });
            // Pro players usually have their own layout, but include links if they use this one
        } else {
            navigation.push({ name: 'Find Players', href: '/app/sparring', icon: UsersIcon });
            navigation.push({ name: 'Sparring Invites', href: '/app/sparring/requests', icon: CalendarIcon });
        }
    } else if (user?.role === 'coach') {
        // Coaches should primarily use /coach dashboard, but providing links here just in case they land on Main Dashboard
        navigation.push({ name: 'Requests', href: '/coach/requests', icon: UsersIcon });
        navigation.push({ name: 'Availability', href: '/coach/availability', icon: CalendarIcon });
    }

    const secondaryNav = []

    return (
        <div className="flex h-full grow flex-col gap-y-10 overflow-y-auto bg-white border-r border-slate-100 px-6 sm:px-8 pb-10 shadow-[10px_0_60px_-15px_rgba(0,0,0,0.02)]">
            <div className="flex h-24 shrink-0 items-center justify-between">
                <Link to="/" className="flex items-center gap-4 group">
                    <div className="h-11 w-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 group-hover:rotate-12 transition-transform duration-500">
                        <TrophyIcon className="h-6 w-6" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-slate-900 group-hover:text-indigo-600 transition-colors uppercase">SportSphere</span>
                </Link>
                {isMobile && (
                    <button onClick={onCloseMobile} className="lg:hidden p-2.5 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                )}
            </div>

            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-12">
                    <li>
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300 mb-6 flex items-center gap-3">
                            Main Menu
                            <div className="h-px flex-1 bg-slate-50" />
                        </div>
                        <ul role="list" className="space-y-2">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <li key={item.name}>
                                        <Link
                                            to={item.href}
                                            onClick={onCloseMobile}
                                            className={twMerge(
                                                "group flex gap-x-4 rounded-2xl p-4 text-[13px] font-bold leading-none transition-all duration-300 relative",
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
                                            {isActive && (
                                                <motion.div
                                                    layoutId="sidebar-active"
                                                    className="absolute -left-8 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-indigo-600 rounded-r-full"
                                                />
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>

                    <li>
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300 mb-6 flex items-center gap-3">
                            Account
                            <div className="h-px flex-1 bg-slate-50" />
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

                    <li className="mt-auto pt-8 border-t border-slate-50">
                        {user?.role === 'admin' ? (
                            <div className="flex items-center gap-x-4 p-4 rounded-3xl opacity-80">
                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 font-black shadow-inner border border-white">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[13px] font-black text-slate-900 truncate">{user?.name}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                        {user?.role}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <Link to="/app/profile" className="flex items-center gap-x-4 p-4 rounded-3xl hover:bg-slate-50 transition-all group">
                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 font-black shadow-inner border border-white group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[13px] font-black text-slate-900 truncate leading-none mb-2">{user?.name}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                        {user?.role}
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
