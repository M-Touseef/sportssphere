const LAHORE_CITY = 'Lahore';

const LAHORE_AREAS = [
    'Johar Town',
    'Wapda Town',
    'DHA',
    'Gulberg',
    'Model Town',
    'Garden Town',
    'Bahria Town',
    'Valencia Town',
    'Faisal Town',
    'Iqbal Town',
    'Cantt',
    'Askari',
    'Township',
    'Allama Iqbal Town',
    'Muslim Town',
    'Shadman',
    'Jail Road',
    'Ferozepur Road',
    'Raiwind Road',
    'Thokar Niaz Baig',
    'Canal Road',
    'Defence Road',
    'Lake City',
    'Paragon City',
    'Samanabad',
    'Shahdara',
    'Mughalpura',
    'Sabzazar',
    'Ravi Road',
    'Mall Road'
];

const normalizeArea = (value, fallback = 'Johar Town') => {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    if (raw.toLowerCase() === LAHORE_CITY.toLowerCase()) return fallback;
    const found = LAHORE_AREAS.find((area) => area.toLowerCase() === raw.toLowerCase());
    return found || raw;
};

module.exports = {
    LAHORE_CITY,
    LAHORE_AREAS,
    normalizeArea
};
