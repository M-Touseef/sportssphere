import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
    Bars3Icon,
    BellIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'
import Tooltip from '../ui/Tooltip'
import UserAvatar from '../ui/UserAvatar'
import { useNotifications } from '../../hooks/useNotifications'
import { getNotificationHref } from '../../utils/notificationLinks'
import {
    buildDefaultNavigation,
    buildHeaderMenuGroups,
    getPlayerProfileHref
} from './navigationConfig'
import BrandLogo from './BrandLogo'

const isActiveItem = (pathname, item) => {
    if (typeof item.match === 'function') {
        return item.match(pathname)
    }

    if (item.href === '/tournaments') {
        return pathname.startsWith('/tournaments')
    }

    if (item.href === '/app') {
        return pathname === '/app'
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

const DesktopNavDropdown = ({ group, pathname }) => {
    const hasActiveChild = group.items.some((item) => isActiveItem(pathname, item))

    return (
        <Menu as="div" className="relative">
            <Menu.Button className={twMerge(
                'group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-black transition-all',
                hasActiveChild
                    ? 'bg-brand-navy text-white shadow-[0_12px_24px_-14px_rgba(3,20,47,0.9)]'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-brand-navy'
            )}>
                <span>{group.title}</span>
                <ChevronDownIcon className={twMerge(
                    'h-4 w-4 transition-transform duration-200',
                    hasActiveChild ? 'text-white/80' : 'text-slate-400 group-hover:text-slate-700'
                )} />
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 -translate-y-2"
                enterTo="transform opacity-100 translate-y-0"
                leave="transition ease-in duration-120"
                leaveFrom="transform opacity-100 translate-y-0"
                leaveTo="transform opacity-0 -translate-y-2"
            >
                <Menu.Items className="absolute left-1/2 z-50 mt-4 w-[44rem] max-w-[90vw] -translate-x-1/2 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 p-3 shadow-[0_28px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl focus:outline-none">
                    <div className="grid gap-3 md:grid-cols-[15rem_minmax(0,1fr)]">
                        <div className="rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92)_60%,_rgba(226,232,240,0.85))] p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                                {group.kicker}
                            </p>
                            <h3 className="mt-3 text-xl font-black tracking-tight text-brand-navy">
                                {group.title}
                            </h3>
                            <p className="mt-3 text-[13px] leading-6 text-slate-500">
                                {group.description}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {group.items.map((item) => {
                                const isActive = isActiveItem(pathname, item)
                                const Icon = item.icon

                                return (
                                    <Menu.Item key={item.name}>
                                        {({ active }) => (
                                            <Link
                                                to={item.href}
                                                className={twMerge(
                                                    'group relative overflow-hidden rounded-[1.5rem] border p-4 transition-all',
                                                    isActive
                                                        ? 'border-brand-navy bg-brand-navy text-white shadow-[0_18px_30px_-18px_rgba(3,20,47,0.8)]'
                                                        : active
                                                            ? 'border-slate-300 bg-slate-50 text-slate-950'
                                                            : 'border-slate-200/80 bg-white text-slate-800'
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={twMerge(
                                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
                                                        isActive
                                                            ? 'border-white/10 bg-white/10 text-white'
                                                            : 'border-slate-200 bg-slate-50 text-slate-500'
                                                    )}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-black leading-none">{item.name}</p>
                                                        {item.description && (
                                                            <p className={twMerge(
                                                                'mt-2 text-[11px] leading-5',
                                                                isActive ? 'text-white/72' : 'text-slate-500'
                                                            )}>
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        )}
                                    </Menu.Item>
                                )
                            })}
                        </div>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    )
}

const DashboardHeader = ({ user, logout, setSidebarOpen, navigation, navigationContext }) => {
    const { notifications, hasUnread, unreadCount, markAllRead, markNotificationRead } = useNotifications()
    const location = useLocation()
    const pathname = location.pathname
    const navItems = navigation || buildDefaultNavigation(user)
    const { directItems, grouped } = buildHeaderMenuGroups(navItems, user, navigationContext)
    const userRoleLabel = user?.role === 'player'
        ? (user?.skillLevel === 'professional' ? 'Professional Player' : 'Non-Professional Player')
        : user?.role
    const profileHref = getPlayerProfileHref(user)
    const userNavigation = [
        ...(user?.role === 'admin'
            ? []
            : [{ name: 'My Profile', href: profileHref, icon: UserIcon }]),
        { name: 'Logout', onClick: logout, icon: ArrowRightOnRectangleIcon },
    ]

    return (
        <header className="sticky top-0 z-40 border-b border-sky-100/70 bg-[#f4f9fc]/90 px-3 py-3 backdrop-blur-xl sm:px-5">
            <div className="mx-auto flex min-h-[68px] max-w-[92rem] items-center justify-between gap-4 rounded-[1.4rem] border border-white/80 bg-white/95 px-3 shadow-[0_18px_55px_-26px_rgba(3,20,47,0.45)] backdrop-blur-xl sm:px-4">
                <div className="flex min-w-0 items-center gap-3 lg:gap-8">
                    <button
                        type="button"
                        className="rounded-xl border border-sky-100 bg-sky-50/70 p-2.5 text-brand-navy transition hover:bg-sky-100 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="h-5 w-5" />
                    </button>

                    <BrandLogo />

                    <nav className="hidden items-center gap-2 lg:flex">
                        {directItems.map((item) => {
                            const isActive = isActiveItem(pathname, item)
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={twMerge(
                                        'rounded-full px-3 py-2 text-[13px] font-black transition-all',
                                        isActive
                                            ? 'bg-brand-navy text-white shadow-[0_12px_24px_-14px_rgba(3,20,47,0.9)]'
                                            : 'text-slate-600 hover:bg-sky-50 hover:text-brand-navy'
                                    )}
                                >
                                    {item.name}
                                </Link>
                            )
                        })}

                        {grouped.map((group) => (
                            <DesktopNavDropdown key={group.key} group={group} pathname={pathname} />
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <Menu as="div" className="relative">
                        <Tooltip content="Notifications" position="bottom">
                            <Menu.Button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50/70 text-brand-navy outline-none transition hover:border-sky-200 hover:bg-sky-100">
                                <BellIcon className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-0.5 text-[10px] font-bold leading-none text-white">
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
                            <Menu.Items className="absolute right-0 z-50 mt-3 w-80 origin-top-right overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] focus:outline-none">
                                <div className="flex items-center justify-between border-b border-slate-50 bg-white px-4 py-3">
                                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                                    {hasUnread && (
                                        <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-800">
                                            New
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-[280px] overflow-y-auto bg-white">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-xs text-slate-400">
                                            You're all caught up. No notifications.
                                        </div>
                                    ) : (
                                        notifications.map((item) => {
                                            const pendingReview =
                                                item.meta?.kind === 'pending_verification' && user?.role === 'admin'
                                            const href = getNotificationHref(item)
                                            const rowClass = (active) =>
                                                twMerge(
                                                    'flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0',
                                                    active ? 'bg-slate-50' : 'bg-white'
                                                )
                                            const inner = () => (
                                                <>
                                                    <div
                                                        className={twMerge(
                                                            'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
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
                                                        <p className="mt-0.5 bg-transparent text-[11px] leading-relaxed text-slate-500">
                                                            {item.message}
                                                        </p>
                                                        {item.createdAt && (
                                                            <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                                                                {new Date(item.createdAt).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </>
                                            )
                                            return (
                                                <Menu.Item key={item._id}>
                                                    {({ active }) =>
                                                        pendingReview || href ? (
                                                            <Link
                                                                to={href || '/admin/dashboard?tab=verification'}
                                                                onClick={() => {
                                                                    if (!item.isRead) markNotificationRead(item._id)
                                                                }}
                                                                className={rowClass(active)}
                                                            >
                                                                {inner()}
                                                            </Link>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => !item.isRead && markNotificationRead(item._id)}
                                                                className={rowClass(active)}
                                                            >
                                                                {inner()}
                                                            </button>
                                                        )
                                                    }
                                                </Menu.Item>
                                            )
                                        })
                                    )}
                                </div>
                                {notifications.length > 0 && hasUnread && (
                                    <div className="border-t border-slate-50 bg-slate-50/50 p-2">
                                        <button
                                            onClick={markAllRead}
                                            className="w-full py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-sky-700"
                                        >
                                            Mark all as read
                                        </button>
                                    </div>
                                )}
                            </Menu.Items>
                        </Transition>
                    </Menu>

                    <div className="hidden h-8 w-px bg-sky-100 sm:block" />

                    <Menu as="div" className="relative">
                        <Menu.Button className="group flex items-center gap-3 rounded-full border border-sky-100 bg-white p-1 pr-3 transition hover:border-sky-200">
                            <div className="hidden text-right lg:block">
                                <span className="block text-[13px] font-extrabold leading-none text-brand-navy">{user?.name}</span>
                                <span className="mt-1.5 block max-w-[11rem] truncate text-[10px] font-semibold tracking-wide text-slate-500" title={userRoleLabel}>
                                    {userRoleLabel}
                                </span>
                            </div>
                            <UserAvatar
                                user={user}
                                className="h-9 w-9 rounded-full border border-sky-100 bg-white text-sm transition-colors group-hover:border-sky-200"
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
                            <Menu.Items className="absolute right-0 z-50 mt-4 w-64 origin-top-right rounded-3xl border border-slate-100 bg-white p-2.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] focus:outline-none">
                                <div className="mb-2 border-b border-slate-50 px-4 py-3">
                                    <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Logged in as</p>
                                    <p className="truncate text-sm font-black text-slate-900">{user?.email}</p>
                                </div>
                                {userNavigation.map((item) => (
                                    <Menu.Item key={item.name}>
                                        {({ active }) => (
                                            item.onClick ? (
                                                <button
                                                    onClick={item.onClick}
                                                    className={twMerge(
                                                        'flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[13px] font-bold transition-all',
                                                        active ? 'bg-rose-50 text-rose-600' : 'text-slate-500'
                                                    )}
                                                >
                                                    <item.icon className="h-5 w-5" />
                                                    {item.name}
                                                </button>
                                            ) : (
                                                <Link
                                                    to={item.href}
                                                    className={twMerge(
                                                        'flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[13px] font-bold transition-all',
                                                        active ? 'bg-sky-50 text-sky-700' : 'text-slate-500'
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
            </div>
        </header>
    )
}

export default DashboardHeader
