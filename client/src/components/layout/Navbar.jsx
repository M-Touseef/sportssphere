import { Fragment } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, BellIcon, TrophyIcon, SparklesIcon, UserIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import Tooltip from '../ui/Tooltip'
import { useNotifications } from '../../hooks/useNotifications'
import { getNotificationHref } from '../../utils/notificationLinks'

const navigation = [
    { name: 'Championships', href: '/tournaments' },
    { name: 'Coaches', href: '/coaches' },
    { name: 'Venues', href: '/courts' },
]

export default function Navbar() {
    const { user, logout } = useAuth()
    const location = useLocation()
    const { notifications, hasUnread, unreadCount, markAllRead, markNotificationRead } = useNotifications()

    return (
        <Disclosure as="nav" className="sticky top-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] transition-all">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between items-center">
                            {/* Logo Section */}
                            <div className="flex items-center gap-10">
                                <Link to="/" className="flex items-center gap-2.5 group">
                                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-110 transition-all">
                                        <TrophyIcon className="h-5 w-5" />
                                    </div>
                                    <span className="relative text-base sm:text-lg font-black tracking-[0.04em] text-slate-900 transition-all duration-300 group-hover:text-indigo-700">
                                        SportsSphere
                                        <span className="pointer-events-none absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300 group-hover:w-full" />
                                    </span>
                                </Link>

                                {user && (
                                <div className="hidden lg:flex gap-6">
                                    {navigation.map((item) => {
                                        const isActive = location.pathname === item.href;
                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.href}
                                                className={twMerge(
                                                    "relative text-sm font-medium transition-all px-2 py-1 rounded-lg",
                                                    isActive ? "text-primary" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                                )}
                                            >
                                                {item.name}
                                                {isActive && (
                                                    <div className="absolute -bottom-[20px] left-0 w-full h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                                )}
                            </div>

                            {/* Actions Section */}
                            <div className="flex items-center gap-3">
                                {user && (
                                <div className="hidden sm:flex items-center gap-2">
                                    <Menu as="div" className="relative">
                                        <Menu.Button className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative outline-none">
                                            <BellIcon className="h-5 w-5" />
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-0.5 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white leading-none">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
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
                                            <Menu.Items className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-2xl bg-white border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] focus:outline-none overflow-hidden">
                                                <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-white">
                                                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                                                    {hasUnread && (
                                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto">
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
                                </div>
                                )}

                                {user ? (
                                    <Menu as="div" className="relative ml-2">
                                        <Menu.Button className="flex items-center p-1 group">
                                            <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shadow-sm ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                                {user.name[0]?.toUpperCase()}
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
                                            <Menu.Items className="absolute right-0 z-50 mt-3 w-64 origin-top-right rounded-2xl bg-white border border-slate-100 p-2 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] focus:outline-none overflow-hidden">
                                                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                                    <p className="text-xs font-medium text-slate-400">Tactical Operator</p>
                                                    <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                                                </div>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link to="/app/profile" className={twMerge("flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all", active ? "bg-slate-50 text-primary" : "text-slate-600")}>
                                                            <UserIcon className="h-4 w-4" />
                                                            Public Profile
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link to="/app" className={twMerge("flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all", active ? "bg-slate-50 text-primary" : "text-slate-600")}>
                                                            <SparklesIcon className="h-4 w-4" />
                                                            Dashboard Hub
                                                        </Link>
                                                    )}
                                                </Menu.Item>

                                                <div className="my-1 border-t border-slate-50" />
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <button onClick={logout} className={twMerge("flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all", active ? "bg-rose-50 text-rose-600" : "text-slate-600")}>
                                                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                                            Sign Out
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                ) : (
                                    <div className="hidden sm:flex items-center gap-3">
                                        <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50">
                                            Log in
                                        </Link>
                                        <Link to="/register">
                                            <Button size="sm" className="px-5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200">
                                                Join Now
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                {/* Mobile Toggle */}
                                <Disclosure.Button className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
                                    <span className="sr-only">Toggle Menu</span>
                                    {open ? (
                                        <XMarkIcon className="h-5 w-5" />
                                    ) : (
                                        <Bars3Icon className="h-5 w-5" />
                                    )}
                                </Disclosure.Button>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="lg:hidden border-t border-slate-50 bg-white/95 backdrop-blur-md animate-enter">
                        <div className="p-4 space-y-1">
                            {user && navigation.map((item) => (
                                <Disclosure.Button
                                    key={item.name}
                                    as={Link}
                                    to={item.href}
                                    className={twMerge(
                                        "block px-4 py-3 rounded-2xl text-sm font-semibold transition-all",
                                        location.pathname === item.href ? "bg-indigo-50 text-primary shadow-sm" : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {item.name}
                                </Disclosure.Button>
                            ))}
                            {!user && (
                                <div className="pt-4 mt-4 border-t border-slate-50 flex flex-col gap-2">
                                    <Link to="/login" className="block px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                                        Access Account
                                    </Link>
                                    <Link to="/register" className="block px-4 py-3 rounded-2xl text-sm font-bold bg-primary text-primary-foreground text-center shadow-lg shadow-primary/20">
                                        Join Protocol
                                    </Link>
                                </div>
                            )}
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    )
}
