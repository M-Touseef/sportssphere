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

/** Hour options for selects (06:00 … 22:00). */
export const HOUR_SLOT_OPTIONS = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6;
    const value = `${String(hour).padStart(2, '0')}:00`;
    return { value, label: formatSlotHour(value) };
});
