import { Fragment, useState, useEffect } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, BellIcon, TrophyIcon, SparklesIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import UserAvatar from '../ui/UserAvatar'
import { useNotifications } from '../../hooks/useNotifications'
import { getNotificationHref } from '../../utils/notificationLinks'

const navigation = [
    { name: 'Tournaments', href: '/tournaments' },
    { name: 'Coaches', href: '/coaches' },
    { name: 'Courts', href: '/courts' },
]

const AUTH_PATHS = ['/login', '/register']

export default function Navbar() {
    const { user, logout } = useAuth()
    const location = useLocation()
    const isAuthPage = AUTH_PATHS.includes(location.pathname)
    const { notifications, hasUnread, unreadCount, markAllRead, markNotificationRead } = useNotifications()

    // --- Transparent navbar on home page ---
    const isHomePage = location.pathname === '/'
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        if (!isHomePage) return
        const onScroll = () => setScrolled(window.scrollY > 80)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [isHomePage])

    return (
        <Disclosure as="nav" className={twMerge(
            'sticky top-0 z-[100] border-b shadow-sm navbar-transitioning',
            isHomePage
                ? (scrolled ? 'bg-[#0a0a1a]/95 backdrop-blur-md border-white/10' : 'navbar-transparent border-transparent')
                : 'bg-white/95 backdrop-blur-md border-amber-100/80'
        )}>
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between items-center">
                            <div className="flex items-center gap-8 lg:gap-10">
                                <Link to="/" className="flex items-center gap-2.5 group">
                                    <div className="h-8 w-8 bg-indigo-950 rounded-lg flex items-center justify-center text-amber-200">
                                        <TrophyIcon className="h-5 w-5" />
                                    </div>
                                    <span className={twMerge(
                                        'text-base sm:text-lg font-black tracking-tight navbar-logo-text',
                                        isHomePage ? 'text-white drop-shadow-md' : 'text-indigo-950 group-hover:text-indigo-800'
                                    )}>
                                        SportsSphere
                                    </span>
                                </Link>

                                {user && <div className="hidden lg:flex gap-1">
                                    {navigation.map((item) => {
                                        const isActive = location.pathname.startsWith(item.href)
                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.href}
                                                className={twMerge(
                                                    'text-sm font-bold px-3 py-2 rounded-lg transition-colors navbar-link',
                                                    isHomePage
                                                        ? (isActive ? 'text-white bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10')
                                                        : (isActive ? 'text-indigo-950 bg-amber-50' : 'text-slate-600 hover:text-indigo-950 hover:bg-slate-50')
                                                )}
                                            >
                                                {item.name}
                                            </Link>
                                        )
                                    })}
                                </div>}
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                {user && (
                                    <div className="hidden sm:flex items-center gap-2">
                                        <Menu as="div" className="relative">
                                            <Menu.Button className="p-2 text-slate-500 hover:text-indigo-950 rounded-lg border border-slate-100 relative outline-none">
                                                <BellIcon className="h-5 w-5" />
                                                {unreadCount > 0 && (
                                                    <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-0.5 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white">
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
                                                <Menu.Items className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl bg-white border border-slate-200 shadow-lg focus:outline-none overflow-hidden">
                                                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                                        <p className="text-sm font-bold text-slate-900">Notifications</p>
                                                        {hasUnread && (
                                                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                                New
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="max-h-[280px] overflow-y-auto">
                                                        {notifications.length === 0 ? (
                                                            <p className="px-4 py-6 text-center text-xs text-slate-500">
                                                                No notifications
                                                            </p>
                                                        ) : (
                                                            notifications.map((item) => {
                                                                const href = getNotificationHref(item)
                                                                const rowClass = (active) =>
                                                                    twMerge(
                                                                        'w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 flex gap-3',
                                                                        active ? 'bg-slate-50' : 'bg-white'
                                                                    )
                                                                return (
                                                                    <Menu.Item key={item._id}>
                                                                        {({ active }) =>
                                                                            href ? (
                                                                                <Link
                                                                                    to={href}
                                                                                    onClick={() =>
                                                                                        !item.isRead &&
                                                                                        markNotificationRead(item._id)
                                                                                    }
                                                                                    className={rowClass(active)}
                                                                                >
                                                                                    <span
                                                                                        className={twMerge(
                                                                                            'h-2 w-2 mt-1.5 rounded-full shrink-0',
                                                                                            !item.isRead
                                                                                                ? 'bg-rose-500'
                                                                                                : 'bg-slate-200'
                                                                                        )}
                                                                                    />
                                                                                    <span>
                                                                                        <p className="text-xs font-bold text-slate-900">
                                                                                            {item.title}
                                                                                        </p>
                                                                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                                                                            {item.message}
                                                                                        </p>
                                                                                    </span>
                                                                                </Link>
                                                                            ) : (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        !item.isRead &&
                                                                                        markNotificationRead(item._id)
                                                                                    }
                                                                                    className={rowClass(active)}
                                                                                >
                                                                                    <span className="text-xs font-bold text-slate-700">
                                                                                        {item.title}
                                                                                    </span>
                                                                                </button>
                                                                            )
                                                                        }
                                                                    </Menu.Item>
                                                                )
                                                            })
                                                        )}
                                                    </div>
                                                    {notifications.length > 0 && hasUnread && (
                                                        <div className="p-2 border-t border-slate-100">
                                                            <button
                                                                type="button"
                                                                onClick={markAllRead}
                                                                className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-800"
                                                            >
                                                                Mark all read
                                                            </button>
                                                        </div>
                                                    )}
                                                </Menu.Items>
                                            </Transition>
                                        </Menu>
                                    </div>
                                )}

                                {user ? (
                                    <Menu as="div" className="relative">
                                        <Menu.Button className="block rounded-lg outline-none">
                                            <UserAvatar
                                                user={user}
                                                className="h-9 w-9 rounded-lg text-sm"
                                                fallbackClassName="text-sm"
                                            />
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
                                            <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-white border border-slate-200 p-2 shadow-lg focus:outline-none">
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/app"
                                                            className={twMerge(
                                                                'flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg',
                                                                active ? 'bg-amber-50 text-indigo-950' : 'text-slate-700'
                                                            )}
                                                        >
                                                            <SparklesIcon className="h-4 w-4" />
                                                            Dashboard
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <button
                                                            type="button"
                                                            onClick={logout}
                                                            className={twMerge(
                                                                'flex w-full items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg',
                                                                active ? 'bg-rose-50 text-rose-700' : 'text-slate-700'
                                                            )}
                                                        >
                                                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                                            Sign out
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                ) : (
                                    !isAuthPage && (
                                        <div className="hidden sm:flex items-center gap-2">
                                            <Link
                                                to="/login"
                                                className={twMerge(
                                                    'rounded-lg px-5 py-2 text-sm font-bold transition-colors',
                                                    isHomePage
                                                        ? 'bg-amber-400 text-indigo-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300'
                                                        : 'bg-indigo-950 text-amber-50 hover:bg-indigo-900'
                                                )}
                                            >
                                                Log in
                                            </Link>
                                            <Link to="/register">
                                                <Button
                                                    size="sm"
                                                    className={twMerge(
                                                        'px-5 rounded-lg font-bold',
                                                        isHomePage
                                                            ? 'bg-amber-400 text-indigo-950 hover:bg-amber-300 shadow-lg shadow-amber-400/20'
                                                            : 'bg-indigo-950 text-amber-50 hover:bg-indigo-900'
                                                    )}
                                                >
                                                    Sign up
                                                </Button>
                                            </Link>
                                        </div>
                                    )
                                )}

                                {!isAuthPage && (
                                    <Disclosure.Button className={twMerge(
                                        'lg:hidden p-2 rounded-lg border navbar-menu-btn',
                                        isHomePage
                                            ? 'text-white border-white/25 hover:bg-white/10'
                                            : 'text-slate-600 hover:bg-slate-50 border-slate-200'
                                    )}>
                                        <span className="sr-only">Menu</span>
                                        {open ? (
                                            <XMarkIcon className="h-5 w-5" />
                                        ) : (
                                            <Bars3Icon className="h-5 w-5" />
                                        )}
                                    </Disclosure.Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {!isAuthPage && (
                        <Disclosure.Panel className="lg:hidden border-t border-slate-100 bg-white">
                            <div className="p-4 space-y-1">
                                {user && navigation.map((item) => (
                                    <Disclosure.Button
                                        key={item.name}
                                        as={Link}
                                        to={item.href}
                                        className={twMerge(
                                            'block px-4 py-3 rounded-lg text-sm font-bold',
                                            location.pathname.startsWith(item.href)
                                                ? 'bg-amber-50 text-indigo-950'
                                                : 'text-slate-700 hover:bg-slate-50'
                                        )}
                                    >
                                        {item.name}
                                    </Disclosure.Button>
                                ))}
                                {!user && (
                                    <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-2">
                                        <Link
                                            to="/login"
                                            className="block rounded-lg bg-indigo-950 px-4 py-3 text-center text-sm font-bold text-amber-50 hover:bg-indigo-900"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="block px-4 py-3 rounded-lg text-sm font-bold bg-indigo-950 text-amber-50 text-center"
                                        >
                                            Sign up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </Disclosure.Panel>
                    )}
                </>
            )}
        </Disclosure>
    )
}
