/** Force time to top of hour (HH:00) for hourly booking logic. */
const normalizeToHour = (time) => {
    if (!time || typeof time !== 'string') return time;
    const [h] = time.trim().split(':');
    const hour = parseInt(h, 10);
    if (Number.isNaN(hour) || hour < 0 || hour > 23) return time;
    return `${String(hour).padStart(2, '0')}:00`;
};

module.exports = { normalizeToHour };
