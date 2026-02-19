const { check, validationResult } = require('express-validator');

// Validation result middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorArray = errors.array();
        return res.status(400).json({
            success: false,
            error: errorArray[0].msg,
            errors: errorArray
        });
    }
    next();
};

// Registration validation rules
exports.registerValidation = [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Invalid role').optional().isIn(['player', 'coach', 'organizer', 'admin']),
    check('skillLevel', 'Invalid skill level').optional().isIn(['professional', 'non-professional']),
    validate
];

// Login validation rules
exports.loginValidation = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    validate
];

// Profile update validation rules
exports.updateProfileValidation = [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
    validate
];
