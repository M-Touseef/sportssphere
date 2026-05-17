/** Normalize API time string to top of the hour (HH:00). */
export const normalizeToHour = (time) => {
    if (!time || typeof time !== 'string') return time;
    const [h] = time.trim().split(':');
    const hour = parseInt(h, 10);
    if (Number.isNaN(hour) || hour < 0 || hour > 23) return time;
    return `${String(hour).padStart(2, '0')}:00`;
};

/** Display a slot time as hour-only (e.g. "9 AM"). */
export const formatSlotHour = (time) => {
    const normalized = normalizeToHour(time);
    if (!normalized) return '';
    const hour = parseInt(normalized.split(':')[0], 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12} ${period}`;
};

/** Display a range like "9 AM – 10 AM". */
export const formatSlotHourRange = (startTime, endTime) => {
    if (!startTime) return '';
    if (!endTime || endTime === startTime) return formatSlotHour(startTime);
    return `${formatSlotHour(startTime)} – ${formatSlotHour(endTime)}`;
};

/** Duration of a session in hours (uses `duration` or start/end times). */
export const sessionDurationHours = (session) => {
    if (session?.duration != null && session.duration > 0) {
        return Number(session.duration);
    }
    if (!session?.startTime || !session?.endTime) return 0;
    const start = parseInt(normalizeToHour(session.startTime).split(':')[0], 10);
    const end = parseInt(normalizeToHour(session.endTime).split(':')[0], 10);
    const diff = end - start;
    return diff > 0 ? diff : 1;
};

/** Sessions that count toward hours coached (completed, or confirmed and already ended). */
export const isSessionCountedAsCoached = (session) => {
    if (!session || session.status === 'cancelled') return false;
    if (session.status === 'completed') return true;
    if (session.status !== 'confirmed') return false;
    const end = new Date(session.date);
    const [eh, em] = normalizeToHour(session.endTime || '00:00').split(':').map(Number);
    end.setHours(eh, em || 0, 0, 0);
    return end.getTime() < Date.now();
};

/** Total coaching hours delivered so far. */
export const sumCoachingHours = (sessions) =>
    (sessions || [])
        .filter(isSessionCountedAsCoached)
        .reduce((total, session) => total + sessionDurationHours(session), 0);

/** Format hours for display (e.g. 12 or 12.5). */
export const formatCoachingHours = (hours) => {
    const n = Number(hours) || 0;
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
};

/** Hour options for selects (06:00 … 22:00). */
export const HOUR_SLOT_OPTIONS = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6;
    const value = `${String(hour).padStart(2, '0')}:00`;
    return { value, label: formatSlotHour(value) };
});
