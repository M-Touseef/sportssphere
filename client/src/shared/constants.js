export const USER_ROLES = {
    PROFESSIONAL: 'professional',
    NON_PROFESSIONAL: 'non-professional',
    COACH: 'coach',
    ORGANIZER: 'organizer',
    ADMIN: 'admin'
};

/** Only bracket format supported for combat tournaments. */
export const TOURNAMENT_FORMAT = 'single_elimination';
export const TOURNAMENT_FORMAT_LABEL = 'Single Elimination (Knockout)';

/** Tournament category tactical grade (division tier). */
export const TOURNAMENT_GRADES = [
    { value: 'division', label: 'Division' },
    { value: 'national', label: 'National' },
    { value: 'international', label: 'International' }
];

export const formatTournamentGrade = (value) => {
    const found = TOURNAMENT_GRADES.find((g) => g.value === value);
    return found?.label || value;
};

/** Pakistani mobile: exactly 11 digits (e.g. 03XXXXXXXXX). */
export const validateMobile11Digits = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length !== 11) {
        return 'Mobile number must be exactly 11 digits';
    }
    return true;
};

// Tournament Categories
export const TOURNAMENT_CATEGORIES = {
    MENS_SINGLES: 'mens_singles',
    WOMENS_SINGLES: 'womens_singles',
    MENS_DOUBLES: 'mens_doubles',
    WOMENS_DOUBLES: 'womens_doubles',
    MIXED_DOUBLES: 'mixed_doubles',
    JUNIOR_BOYS: 'junior_boys',
    JUNIOR_GIRLS: 'junior_girls'
};

// Payment Statuses
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

// Booking Statuses
export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed'
};

// Match Statuses
export const MATCH_STATUS = {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    WALKOVER: 'walkover'
};

// Skill Status
export const SKILL_LEVELS = {
    NON_PROFESSIONAL: 'non-professional',
    PROFESSIONAL: 'professional'
};
