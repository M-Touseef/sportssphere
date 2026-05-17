/** Resolve in-app link for a notification row (bell menu). */
export const getNotificationHref = (item) => {
    const kind = item?.meta?.kind;
    if (kind === 'pending_verification') {
        return '/admin/dashboard?tab=verification';
    }
    if (kind === 'sparring_request_status') {
        return '/app/sparring/requests';
    }
    if (kind === 'coaching_session_status') {
        return '/app/sessions';
    }
    return null;
};
