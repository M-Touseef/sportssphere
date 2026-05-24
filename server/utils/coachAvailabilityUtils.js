const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const normalizeDate = (dateValue) => {
    const d = new Date(dateValue);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getBookingId = (courtBookingRef) => {
    if (!courtBookingRef) return null;
    if (typeof courtBookingRef === 'object' && courtBookingRef._id) {
        return courtBookingRef._id.toString();
    }
    return courtBookingRef.toString();
};

const dayFromDate = (dateValue) => DAY_NAMES[normalizeDate(dateValue).getDay()];

const timesOverlap = (aStart, aEnd, bStart, bEnd) =>
    aStart < bEnd && bStart < aEnd;

module.exports = {
    DAY_NAMES,
    normalizeDate,
    getBookingId,
    dayFromDate,
    timesOverlap
};
