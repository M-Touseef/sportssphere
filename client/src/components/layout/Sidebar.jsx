import { Link, useLocation } from 'react-router-dom'
import {
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import { buildDefaultNavigation, buildDefaultSecondaryNav } from './navigationConfig'

const MotionDiv = motion.div

const getBrandPalette = (brandVariant) => {
    switch (brandVariant) {
        case 'coach':
            return {
                badge: 'from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-emerald-200/80',
                accent: 'from-emerald-400 via-teal-400 to-cyan-400',
                glow: 'from-emerald-500/20 via-teal-400/10 to-transparent',
                label: 'text-emerald-700',
            }
        case 'professional':
            return {
                badge: 'from-orange-400 via-amber-400 to-yellow-300 text-slate-950 shadow-orange-200/70',
                accent: 'from-orange-400 via-amber-400 to-yellow-300',
                glow: 'from-orange-400/20 via-amber-300/10 to-transparent',
                label: 'text-orange-700',
            }
        default:
            return {
                badge: 'from-slate-900 via-slate-800 to-slate-700 text-white shadow-slate-300/80',
                accent: 'from-slate-900 via-slate-700 to-slate-500',
                glow: 'from-slate-900/10 via-slate-400/10 to-transparent',
                label: 'text-slate-600',
            }
    }
}

const Sidebar = ({
    user,
    logout,
    onCloseMobile,
    isMobile = false,
    navigation,
    secondaryNav,
    brandTitle = 'SportsSphere',
    brandEyebrow = 'Workspace',
    brandDescription = 'Your courts, tournaments, sessions, and team activity in one place.',
    brandHref = '/',
    brandVariant = 'default',
}) => {
    const location = useLocation()
    const palette = getBrandPalette(brandVariant)
    const mainNav = navigation || buildDefaultNavigation(user)
    const accountNav = secondaryNav || buildDefaultSecondaryNav(user, logout)
    const userRoleLabel = user?.role === 'player'
        ? (user?.skillLevel === 'professional' ? 'Professional Player' : 'Non-Professional Player')
        : user?.role

    const isActiveItem = (item) => {
        if (typeof item.match === 'function') {
            return item.match(location.pathname)
        }

        if (item.href === '/tournaments') {
            return location.pathname.startsWith('/tournaments')
        }

        if (item.href === '/app') {
            return location.pathname === '/app'
        }

        return location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
    }

    const renderItem = (item, kind = 'link') => {
        const isActive = kind === 'link' ? isActiveItem(item) : false
        const Icon = item.icon
        const baseClasses = twMerge(
            'group relative flex w-full items-start gap-3 overflow-hidden rounded-3xl border px-4 py-4 text-left transition-all duration-300',
            isActive
                ? 'border-slate-900/80 bg-slate-950 text-white shadow-[0_18px_36px_-16px_rgba(15,23,42,0.75)]'
                : 'border-white/80 bg-white/70 text-slate-700 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.35)] hover:border-slate-200 hover:bg-white hover:text-slate-950'
        )

        const content = (
            <>
                <div className={twMerge(
                    'relative z-10 mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300',
                    isActive
                        ? 'border-white/10 bg-white/10 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-900'
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-black tracking-[0.01em]">{item.name}</span>
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white/80" />}
                    </div>
                    {item.description && (
                        <p className={twMerge(
                            'mt-1 text-[11px] leading-5',
                            isActive ? 'text-white/72' : 'text-slate-500'
                        )}>
                            {item.description}
                        </p>
                    )}
                    <div className={twMerge(
                        'mt-3 h-px origin-left bg-gradient-to-r transition-transform duration-300',
                        isActive
                            ? 'scale-100 from-white/60 via-white/20 to-transparent'
                            : 'scale-0 from-slate-400/70 via-slate-200 to-transparent group-hover:scale-100'
                    )} />
                </div>
                <div className={twMerge(
                    'absolute inset-x-0 top-0 h-full bg-gradient-to-br opacity-0 transition-opacity duration-300',
                    isActive
                        ? 'opacity-100 from-white/[0.08] via-transparent to-transparent'
                        : 'group-hover:opacity-100 from-slate-100/40 via-transparent to-transparent'
                )} />
            </>
        )

        if (item.onClick) {
            return (
                <button
                    type="button"
                    onClick={() => {
                        onCloseMobile?.()
                        item.onClick()
                    }}
                    className={baseClasses}
                >
                    {content}
                </button>
            )
        }

        return (
            <Link to={item.href} onClick={onCloseMobile} className={baseClasses}>
                {content}
            </Link>
        )
    }

    return (
        <div className="relative flex h-full grow flex-col overflow-hidden border-r border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(248,250,252,0.98)_38%,_rgba(241,245,249,0.98)_100%)]">
            <div className={twMerge('pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-br', palette.glow)} />

            <div className="relative flex items-center justify-between border-b border-slate-200/70 px-6 pb-5 pt-6 sm:px-8">
                <Link to={brandHref} className="group min-w-0" onClick={onCloseMobile}>
                    <div className="flex items-center gap-3">
                        <MotionDiv whileHover={{ scale: 1.03 }}>
                            <img
                                src="/images/homepage/website-logo-header.png"
                                alt=""
                                className="h-14 w-14 rounded-[1.35rem] border border-sky-100 bg-white object-cover shadow-[0_18px_36px_-18px_rgba(3,20,47,0.5)]"
                            />
                        </MotionDiv>
                        <div className="min-w-0">
                            <p className={twMerge('text-[10px] font-black uppercase tracking-[0.28em]', palette.label)}>
                                {brandEyebrow}
                            </p>
                            <h2 className="truncate text-xl font-black tracking-tight text-brand-navy">{brandTitle}</h2>
                        </div>
                    </div>
                    <p className="mt-3 max-w-xs text-[12px] leading-5 text-slate-500">
                        {brandDescription}
                    </p>
                </Link>
                {isMobile && (
                    <button
                        onClick={onCloseMobile}
                        className="ml-4 rounded-2xl border border-slate-200 bg-white/80 p-2.5 text-slate-500 transition-colors hover:text-slate-950"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="relative flex flex-1 flex-col overflow-y-auto px-5 pb-6 pt-6 sm:px-6">
                <div className="mb-4 flex items-center gap-3 px-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Main menu</span>
                    <div className={twMerge('h-px flex-1 bg-gradient-to-r', palette.accent)} />
                </div>

                <nav className="space-y-3">
                    {mainNav.map((item) => (
                        <div key={item.name}>{renderItem(item)}</div>
                    ))}
                </nav>

                <div className="mt-8 mb-4 flex items-center gap-3 px-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Account</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent" />
                </div>

                <div className="space-y-3">
                    {accountNav.map((item) => (
                        <div key={item.name}>{renderItem(item, item.onClick ? 'action' : 'link')}</div>
                    ))}
                </div>

                <div className="mt-auto pt-8">
                    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
                        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-slate-100/90 via-white to-slate-100/70" />
                        <div className="relative flex items-center gap-4">
                            <div className={twMerge(
                                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-black shadow-inner',
                                brandVariant === 'professional'
                                    ? 'from-orange-200 to-amber-100 text-orange-900'
                                    : brandVariant === 'coach'
                                        ? 'from-emerald-100 to-cyan-100 text-emerald-900'
                                        : 'from-slate-200 to-slate-100 text-slate-900'
                            )}>
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-black text-slate-950">{user?.name}</p>
                                <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                    {userRoleLabel || 'Member'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Sidebar
