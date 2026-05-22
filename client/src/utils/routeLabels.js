const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export const SEGMENT_LABELS = {
    app: 'Dashboard',
    coach: 'Coach portal',
    coaches: 'Coaches',
    courts: 'Courts',
    org: 'Organizer',
    admin: 'Admin',
    tournaments: 'Tournaments',
    profile: 'Profile',
    schedule: 'Schedule',
    requests: 'Requests',
    bookings: 'Bookings',
    sessions: 'Sessions',
    sparring: 'Sparring',
    create: 'Create',
    edit: 'Edit',
    brackets: 'Brackets',
    dashboard: 'Dashboard',
    settings: 'Settings',
    registrations: 'Registrations',
    verification: 'Verification',
    chatbot: 'AI Assistant',
    payment: 'Payment',
    return: 'Payment',
};

const idSegmentLabel = (parentSegment) => {
    const byParent = {
        coaches: 'Coach profile',
        courts: 'Venue details',
        tournaments: 'Tournament',
    };
    return byParent[parentSegment] || 'Details';
};

export const formatSegmentLabel = (segment, index, pathnames) => {
    if (OBJECT_ID_RE.test(segment)) {
        return idSegmentLabel(pathnames[index - 1]);
    }
    if (SEGMENT_LABELS[segment]) {
        return SEGMENT_LABELS[segment];
    }
    return segment.replace(/-/g, ' ');
};

/** Human-readable page title for header / breadcrumbs (never raw Mongo IDs). */
export const getPageTitleFromPath = (pathname) => {
    const pathnames = pathname.split('/').filter(Boolean);
    if (pathnames.length === 0) {
        return 'Home';
    }

    const lastIndex = pathnames.length - 1;
    const last = pathnames[lastIndex];
    const label = formatSegmentLabel(last, lastIndex, pathnames);

    return label.replace(/\b\w/g, (char) => char.toUpperCase());
};

/** Icon key for dashboard header (maps to Heroicons in DashboardHeader). */
export const getPageIconKeyFromPath = (pathname) => {
    const root = pathname.split('/').filter(Boolean)[0] || 'app';
    const keys = {
        courts: 'venue',
        coaches: 'coach',
        tournaments: 'tournament',
        org: 'organizer',
        admin: 'admin',
        coach: 'schedule',
        pro: 'pro',
        app: 'dashboard',
        profile: 'profile',
        payment: 'payment',
    };
    return keys[root] || 'dashboard';
};
