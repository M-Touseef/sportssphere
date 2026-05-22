import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
    Bars3Icon,
    BellIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    HomeIcon,
    MapPinIcon,
    AcademicCapIcon,
    TrophyIcon,
    CalendarIcon,
    InboxIcon,
    Cog6ToothIcon,
    FireIcon,
    CreditCardIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'
import Tooltip from '../ui/Tooltip'
import { useNotifications } from '../../hooks/useNotifications'
import { getNotificationHref } from '../../utils/notificationLinks'
import { getPageTitleFromPath, getPageIconKeyFromPath } from '../../utils/routeLabels'

const PAGE_ICONS = {
    dashboard: HomeIcon,
    venue: MapPinIcon,
    coach: AcademicCapIcon,
    tournament: TrophyIcon,
    organizer: FireIcon,
    admin: ChartBarIcon,
    schedule: CalendarIcon,
    pro: TrophyIcon,
    profile: UserIcon,
    payment: CreditCardIcon,
    requests: InboxIcon,
    settings: Cog6ToothIcon,
};

const DashboardHeader = ({ user, logout, setSidebarOpen }) => {
    const { notifications, hasUnread, unreadCount, markAllRead, markNotificationRead } = useNotifications()
    const location = useLocation()
    const currentSection = getPageTitleFromPath(location.pathname)
    const PageIcon = PAGE_ICONS[getPageIconKeyFromPath(location.pathname)] || HomeIcon
    const userRoleLabel = user?.role === 'player'
        ? (user?.skillLevel === 'professional' ? 'Professional Player' : 'Non-Professional Player')
        : user?.role;
    const userNavigation = [
        { name: 'My Profile', href: '/profile', icon: UserIcon },
        { name: 'Logout', onClick: logout, icon: ArrowRightOnRectangleIcon },
    ];

    return (
        <header className="sticky top-0 z-40 h-20 bg-white/70 backdrop-blur-md border-b border-slate-100 px-6 sm:px-8 lg:px-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
                <button
                    type="button"
                    className="lg:hidden p-2.5 text-slate-400 hover:text-slate-900 bg-white border border-slate-100 rounded-xl transition-all shadow-sm"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Bars3Icon className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div
                        className="hidden sm:flex h-10 w-10 shrink-0 rounded-xl bg-indigo-600 text-white items-center justify-center shadow-md shadow-indigo-200/80"
                        aria-hidden
                    >
                        <PageIcon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">{currentSection}</h2>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Menu as="div" className="relative">
                    <Tooltip content="Notifications" position="bottom">
                        <Menu.Button className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-2xl transition-all relative shadow-sm outline-none">
                            <BellIcon className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-0.5 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white leading-none">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Menu.Button>
                    </Tooltip>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 z-50 mt-3 w-80 origin-top-right rounded-2xl bg-white border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] focus:outline-none overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-white">
                                <p className="text-sm font-bold text-slate-900">Notifications</p>
                                {hasUnread && (
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                        New
                                    </span>
                                )}
                            </div>
                            <div className="max-h-[280px] overflow-y-auto bg-white">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-xs text-slate-400">
                                        You’re all caught up. No notifications.
                                    </div>
                                ) : (
                                    notifications.map((item) => {
                                        const pendingReview =
                                            item.meta?.kind === 'pending_verification' && user?.role === 'admin';
                                        const href = getNotificationHref(item);
                                        const rowClass = (active) =>
                                            twMerge(
                                                'w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 transition-colors flex gap-3',
                                                active ? 'bg-slate-50' : 'bg-white'
                                            );
                                        const inner = (active) => (
                                            <>
                                                <div
                                                    className={twMerge(
                                                        'h-2 w-2 mt-1.5 rounded-full flex-shrink-0',
                                                        !item.isRead ? 'bg-rose-500' : 'bg-slate-200'
                                                    )}
                                                />
                                                <div>
                                                    <p
                                                        className={twMerge(
                                                            'text-xs font-bold',
                                                            !item.isRead ? 'text-slate-900' : 'text-slate-500'
                                                        )}
                                                    >
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed bg-transparent">
                                                        {item.message}
                                                    </p>
                                                    {item.createdAt && (
                                                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                                            {new Date(item.createdAt).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        );
                                        return (
                                            <Menu.Item key={item._id}>
                                                {({ active }) =>
                                                    pendingReview || href ? (
                                                        <Link
                                                            to={href || '/admin/dashboard?tab=verification'}
                                                            onClick={() => {
                                                                if (!item.isRead) markNotificationRead(item._id);
                                                            }}
                                                            className={rowClass(active)}
                                                        >
                                                            {inner(active)}
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => !item.isRead && markNotificationRead(item._id)}
                                                            className={rowClass(active)}
                                                        >
                                                            {inner(active)}
                                                        </button>
                                                    )
                                                }
                                            </Menu.Item>
                                        );
                                    })
                                )}
                            </div>
                            {notifications.length > 0 && hasUnread && (
                                <div className="p-2 border-t border-slate-50 bg-slate-50/50">
                                    <button
                                        onClick={markAllRead}
                                        className="w-full py-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                    >
                                        Mark all as read
                                    </button>
                                </div>
                            )}
                        </Menu.Items>
                    </Transition>
                </Menu>

                <div className="h-8 w-px bg-slate-100 mx-1" />

                <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-3 p-1 group">
                        <div className="hidden lg:flex flex-col items-end mr-1 text-right">
                            <span className="text-[13px] font-extrabold text-slate-900 leading-none">{user?.name}</span>
                            <span className="text-[10px] font-semibold text-slate-500 mt-1.5 tracking-wide max-w-[11rem] truncate" title={userRoleLabel}>{userRoleLabel}</span>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-indigo-100 group-hover:scale-105 transition-all">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </Menu.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 z-50 mt-4 w-64 origin-top-right rounded-3xl bg-white border border-slate-100 p-2.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] focus:outline-none">
                            <div className="px-4 py-3 border-b border-slate-50 mb-2">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Logged in as</p>
                                <p className="text-sm font-black text-slate-900 truncate">{user?.email}</p>
                            </div>
                            {userNavigation.map((item) => (
                                <Menu.Item key={item.name}>
                                    {({ active }) => (
                                        item.onClick ? (
                                            <button
                                                onClick={item.onClick}
                                                className={twMerge(
                                                    "flex w-full items-center gap-3.5 px-4 py-3 text-[13px] font-bold rounded-2xl transition-all",
                                                    active ? "bg-rose-50 text-rose-600" : "text-slate-500"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                {item.name}
                                            </button>
                                        ) : (
                                            <Link
                                                to={item.href}
                                                className={twMerge(
                                                    "flex items-center gap-3.5 px-4 py-3 text-[13px] font-bold rounded-2xl transition-all",
                                                    active ? "bg-indigo-50 text-indigo-600" : "text-slate-500"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                {item.name}
                                            </Link>
                                        )
                                    )}
                                </Menu.Item>
                            ))}
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>
        </header>
    );
};

export default DashboardHeader;
