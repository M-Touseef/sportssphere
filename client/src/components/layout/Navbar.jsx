import { Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import {
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    BellIcon,
    SparklesIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { getNotificationHref } from '../../utils/notificationLinks';
import UserAvatar from '../ui/UserAvatar';
import BrandLogo from './BrandLogo';

const navigation = [
    { name: 'Courts', href: '/courts' },
    { name: 'Coaches', href: '/coaches' },
    { name: 'Tournaments', href: '/tournaments' },
    { name: 'AI Assistant', href: '/chatbot' },
];

const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isAuthPage = authPaths.includes(location.pathname);
    const { notifications, hasUnread, unreadCount, markAllRead, markNotificationRead } = useNotifications();

    if (isAuthPage) {
        return (
            <header className="sticky top-0 z-[100] border-b border-sky-100 bg-white/95 px-5 backdrop-blur-xl">
                <nav className="mx-auto flex h-[72px] max-w-[92rem] items-center" aria-label="Authentication navigation">
                    <BrandLogo compact showTagline={false} />
                </nav>
            </header>
        );
    }

    return (
        <Disclosure
            as="header"
            className={twMerge(
                'inset-x-0 z-[100] px-3 py-3 sm:px-5',
                isHomePage
                    ? 'absolute top-0'
                    : 'sticky top-0 border-b border-sky-100/70 bg-[#f4f9fc]/90 backdrop-blur-xl',
            )}
        >
            {({ open }) => (
                <nav
                    className="mx-auto max-w-[92rem] rounded-[1.4rem] border border-white/80 bg-white/95 px-3 shadow-[0_18px_55px_-26px_rgba(3,20,47,0.45)] backdrop-blur-xl sm:px-4"
                    aria-label="Primary navigation"
                >
                    <div className="flex h-[68px] items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-8">
                            <BrandLogo />

                            <div className="hidden items-center gap-1 lg:flex">
                                {navigation.map((item) => {
                                    const isActive = location.pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={twMerge(
                                                'rounded-full px-4 py-2 text-sm font-bold transition',
                                                isActive
                                                    ? 'bg-brand-navy text-white shadow-lg shadow-slate-900/15'
                                                    : 'text-slate-600 hover:bg-sky-50 hover:text-brand-navy',
                                            )}
                                        >
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {user && (
                                <Menu as="div" className="relative hidden sm:block">
                                    <Menu.Button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50/70 text-brand-navy outline-none transition hover:border-sky-200 hover:bg-sky-100">
                                        <BellIcon className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-0.5 text-[10px] font-bold text-white">
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
                                        <Menu.Items className="absolute right-0 z-50 mt-4 w-80 origin-top-right overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_24px_60px_-24px_rgba(3,20,47,0.4)] focus:outline-none">
                                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                                <p className="text-sm font-black text-brand-navy">Notifications</p>
                                                {hasUnread && (
                                                    <span className="rounded-full bg-lime-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-lime-800">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <div className="max-h-[280px] overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <p className="px-4 py-7 text-center text-xs font-medium text-slate-500">
                                                        No notifications
                                                    </p>
                                                ) : notifications.map((item) => {
                                                    const href = getNotificationHref(item);
                                                    const rowClass = (active) => twMerge(
                                                        'flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left last:border-0',
                                                        active ? 'bg-sky-50' : 'bg-white',
                                                    );
                                                    const content = (
                                                        <>
                                                            <span className={twMerge(
                                                                'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                                                                item.isRead ? 'bg-slate-200' : 'bg-brand-sky',
                                                            )} />
                                                            <span>
                                                                <span className="block text-xs font-bold text-brand-navy">{item.title}</span>
                                                                <span className="mt-1 block text-[11px] leading-5 text-slate-500">{item.message}</span>
                                                            </span>
                                                        </>
                                                    );

                                                    return (
                                                        <Menu.Item key={item._id}>
                                                            {({ active }) => href ? (
                                                                <Link
                                                                    to={href}
                                                                    onClick={() => !item.isRead && markNotificationRead(item._id)}
                                                                    className={rowClass(active)}
                                                                >
                                                                    {content}
                                                                </Link>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => !item.isRead && markNotificationRead(item._id)}
                                                                    className={rowClass(active)}
                                                                >
                                                                    {content}
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    );
                                                })}
                                            </div>
                                            {notifications.length > 0 && hasUnread && (
                                                <div className="border-t border-slate-100 bg-slate-50/70 p-2">
                                                    <button
                                                        type="button"
                                                        onClick={markAllRead}
                                                        className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-sky-700 hover:text-brand-navy"
                                                    >
                                                        Mark all read
                                                    </button>
                                                </div>
                                            )}
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            )}

                            {user ? (
                                <Menu as="div" className="relative">
                                    <Menu.Button className="flex items-center gap-2 rounded-full border border-sky-100 bg-white p-1 pr-2 outline-none transition hover:border-sky-200">
                                        <UserAvatar
                                            user={user}
                                            className="h-9 w-9 rounded-full text-sm"
                                            fallbackClassName="text-sm"
                                        />
                                        <span className="hidden max-w-28 truncate text-xs font-black text-brand-navy sm:block">
                                            {user.name}
                                        </span>
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
                                        <Menu.Items className="absolute right-0 z-50 mt-4 w-60 origin-top-right rounded-2xl border border-sky-100 bg-white p-2 shadow-[0_24px_60px_-24px_rgba(3,20,47,0.4)] focus:outline-none">
                                            <div className="mb-2 border-b border-slate-100 px-3 py-3">
                                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Logged in as</p>
                                                <p className="mt-1 truncate text-sm font-black text-brand-navy">{user.email}</p>
                                            </div>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        to="/app"
                                                        className={twMerge(
                                                            'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold',
                                                            active ? 'bg-sky-50 text-sky-700' : 'text-slate-600',
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
                                                            'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold',
                                                            active ? 'bg-rose-50 text-rose-700' : 'text-slate-600',
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
                                <div className="hidden items-center gap-2 sm:flex">
                                    {location.pathname !== '/login' && (
                                        <Link
                                            to="/login"
                                            className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-sky-50 hover:text-brand-navy"
                                        >
                                            Sign in
                                        </Link>
                                    )}
                                    {location.pathname !== '/register' && (
                                        <Link
                                            to="/register"
                                            className="rounded-full bg-brand-navy px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-sky-800"
                                        >
                                            Get started
                                        </Link>
                                    )}
                                </div>
                            )}

                            <Disclosure.Button className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50/70 text-brand-navy transition hover:bg-sky-100 lg:hidden">
                                <span className="sr-only">Toggle navigation menu</span>
                                {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
                            </Disclosure.Button>
                        </div>
                    </div>

                    <Disclosure.Panel className="border-t border-slate-100 pb-4 pt-3 lg:hidden">
                        <div className="grid gap-2 sm:grid-cols-2">
                            {navigation.map((item) => (
                                <Disclosure.Button
                                    key={item.name}
                                    as={Link}
                                    to={item.href}
                                    className={twMerge(
                                        'rounded-xl px-4 py-3 text-sm font-bold',
                                        location.pathname.startsWith(item.href)
                                            ? 'bg-brand-navy text-white'
                                            : 'text-slate-600 hover:bg-sky-50 hover:text-brand-navy',
                                    )}
                                >
                                    {item.name}
                                </Disclosure.Button>
                            ))}
                        </div>
                        {!user && (
                            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:hidden">
                                <Link to="/login" className="rounded-xl border border-sky-100 px-4 py-3 text-center text-sm font-bold text-brand-navy">
                                    Sign in
                                </Link>
                                <Link to="/register" className="rounded-xl bg-brand-navy px-4 py-3 text-center text-sm font-bold text-white">
                                    Get started
                                </Link>
                            </div>
                        )}
                    </Disclosure.Panel>
                </nav>
            )}
        </Disclosure>
    );
};

export default Navbar;
