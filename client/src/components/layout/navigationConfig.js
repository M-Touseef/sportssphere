import {
    HomeIcon,
    CalendarIcon,
    TrophyIcon,
    ChartBarIcon,
    MapPinIcon,
    AcademicCapIcon,
    FireIcon,
    BuildingOffice2Icon,
    UserGroupIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    InboxIcon,
    BoltIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline'

export const getPlayerProfileHref = (user) =>
    user?.role === 'player' && user?.skillLevel === 'professional'
        ? '/pro/profile'
        : '/app/profile'

export const buildCoachNavigation = () => ([
    {
        name: 'Dashboard',
        href: '/coach/dashboard',
        icon: HomeIcon,
        description: 'Track sessions and coaching activity.',
        groupKey: 'primary',
    },
    {
        name: 'Schedule & Courts',
        href: '/coach/schedule',
        icon: CalendarDaysIcon,
        description: 'Manage time slots and venue plans.',
        groupKey: 'operations',
        match: (pathname) =>
            pathname === '/coach/schedule' ||
            pathname === '/coach/court-bookings' ||
            pathname === '/coach/availability',
    },
    {
        name: 'Requests',
        href: '/coach/requests',
        icon: InboxIcon,
        description: 'Review incoming training requests.',
        groupKey: 'operations',
    },
    {
        name: 'Coach Profile',
        href: '/coach/profile',
        icon: UserCircleIcon,
        description: 'Update rates, expertise, bio, and photo.',
        groupKey: 'operations',
    },
])

export const buildProfessionalNavigation = () => ([
    {
        name: 'Dashboard',
        href: '/pro/dashboard',
        icon: HomeIcon,
        description: 'See your current competitive pulse.',
        groupKey: 'primary',
    },
    {
        name: 'Sparring Availability',
        href: '/pro/availability',
        icon: BoltIcon,
        description: 'Open or close your match slots.',
        groupKey: 'training',
    },
    {
        name: 'Find Coaches',
        href: '/coaches',
        icon: AcademicCapIcon,
        description: 'Browse expert training support.',
        groupKey: 'training',
    },
    {
        name: 'Coaching Sessions',
        href: '/pro/sessions',
        icon: ClipboardDocumentListIcon,
        description: 'Manage lessons and follow-ups.',
        groupKey: 'training',
    },
    {
        name: 'Court Bookings',
        href: '/pro/bookings',
        icon: MapPinIcon,
        description: 'Review your reserved venues.',
        groupKey: 'training',
    },
    {
        name: 'Tournaments',
        href: '/tournaments',
        icon: TrophyIcon,
        description: 'Explore active competition listings.',
        groupKey: 'competition',
    },
    {
        name: 'My Tournaments',
        href: '/pro/registrations',
        icon: FireIcon,
        description: 'Track all registered events.',
        groupKey: 'competition',
    },
    {
        name: 'Matching Requests',
        href: '/pro/requests',
        icon: UserGroupIcon,
        description: 'Respond to sparring interest.',
        groupKey: 'competition',
    },
])

export const buildDefaultNavigation = (user) => {
    const items = [
        {
            name: user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard',
            href: user?.role === 'admin' ? '/admin/dashboard' : '/app',
            icon: user?.role === 'admin' ? ChartBarIcon : HomeIcon,
            description: 'Your daily command center.',
            groupKey: 'primary',
        },
    ]

    if (user?.role === 'organizer') {
        items.push(
            { name: 'My Tournaments', href: '/app/tournaments', icon: TrophyIcon, description: 'Manage your events.', groupKey: 'events' },
            { name: 'Create Tournament', href: '/app/tournaments/create', icon: CalendarIcon, description: 'Launch a new bracket.', groupKey: 'events' },
            { name: 'My Courts', href: '/org/courts', icon: BuildingOffice2Icon, description: 'View venue operations.', groupKey: 'venues' },
        )
    } else if (user?.role === 'player' && user?.skillLevel !== 'professional') {
        items.push(
            { name: 'Book a Court', href: '/courts', icon: MapPinIcon, description: 'Reserve your next session.', groupKey: 'training' },
            { name: 'My Schedule', href: '/app/bookings', icon: CalendarDaysIcon, description: 'See your upcoming bookings.', groupKey: 'training' },
            { name: 'Coaching Sessions', href: '/app/sessions', icon: ClipboardDocumentListIcon, description: 'Track training plans.', groupKey: 'training' },
            { name: 'Find Mentors', href: '/coaches', icon: AcademicCapIcon, description: 'Explore coaching options.', groupKey: 'coaching' },
            { name: 'Tournaments', href: '/tournaments', icon: TrophyIcon, description: 'Browse open competitions.', groupKey: 'competition' },
            { name: 'My Registrations', href: '/app/registrations', icon: FireIcon, description: 'Follow your active signups.', groupKey: 'competition' },
            { name: 'Find Players', href: '/app/sparring', icon: UserGroupIcon, description: 'Discover sparring partners.', groupKey: 'community' },
            { name: 'Sparring Invites', href: '/app/sparring/requests', icon: CalendarIcon, description: 'Respond to player requests.', groupKey: 'community' },
        )
    }

    return items
}

export const buildDefaultSecondaryNav = (user, logout) => {
    const items = []

    if (user?.role !== 'admin') {
        items.push({
            name: 'Profile',
            href: getPlayerProfileHref(user),
            icon: UserCircleIcon,
            description: 'Account and personal details.',
        })
    }

    items.push({
        name: 'Logout',
        onClick: logout,
        icon: ArrowRightOnRectangleIcon,
        description: 'Exit your workspace securely.',
    })

    return items
}

const HEADER_GROUP_META = {
    player: {
        training: {
            title: 'Training',
            kicker: 'Book and prepare',
            description: 'Court time, session planning, and your upcoming routine.',
        },
        coaching: {
            title: 'Coaching',
            kicker: 'Learn faster',
            description: 'Find the right mentor and keep your progress moving.',
        },
        competition: {
            title: 'Competition',
            kicker: 'Enter events',
            description: 'Browse tournaments and stay on top of your registrations.',
        },
        community: {
            title: 'Community',
            kicker: 'Meet players',
            description: 'Find sparring partners and respond to match invites.',
        },
    },
    professional: {
        training: {
            title: 'Training',
            kicker: 'Stay match ready',
            description: 'Availability, coaching, court time, and session follow-up.',
        },
        competition: {
            title: 'Competition',
            kicker: 'Compete and respond',
            description: 'Tournament entries, active events, and incoming match requests.',
        },
    },
    coach: {
        operations: {
            title: 'Coaching Ops',
            kicker: 'Run the schedule',
            description: 'Manage athlete requests, calendars, courts, and lesson flow.',
        },
    },
    organizer: {
        events: {
            title: 'Events',
            kicker: 'Build the tournament',
            description: 'Create tournaments, manage brackets, and oversee registrations.',
        },
        venues: {
            title: 'Venues',
            kicker: 'Operate the facility',
            description: 'Keep courts and venue details organized and accessible.',
        },
    },
    admin: {
        system: {
            title: 'System',
            kicker: 'Platform oversight',
            description: 'High-level access for review, approvals, and platform operations.',
        },
    },
}

export const getNavigationContext = (user, explicitContext) => {
    if (explicitContext) return explicitContext
    if (user?.role === 'coach') return 'coach'
    if (user?.role === 'organizer') return 'organizer'
    if (user?.role === 'admin') return 'admin'
    if (user?.role === 'player' && user?.skillLevel === 'professional') return 'professional'
    return 'player'
}

export const buildHeaderMenuGroups = (navigation = [], user, explicitContext) => {
    const context = getNavigationContext(user, explicitContext)
    const meta = HEADER_GROUP_META[context] || HEADER_GROUP_META.player
    const directItems = navigation.filter((item) => item.groupKey === 'primary')
    const grouped = Object.entries(meta)
        .map(([key, groupMeta]) => ({
            key,
            ...groupMeta,
            items: navigation.filter((item) => item.groupKey === key),
        }))
        .filter((group) => group.items.length > 0)

    return { context, directItems, grouped }
}
