const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const optionalAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // If token is invalid, we just proceed as guest
        next();
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};

// Middleware to require professional skill level
// Middleware to require professional skill level or Coach role
const requireProfessional = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if ((req.user.skillLevel === 'professional' || req.user.role === 'coach') && req.user.verified) {
        next();
    } else if ((req.user.skillLevel === 'professional' || req.user.role === 'coach') && !req.user.verified) {
        return res.status(403).json({
            error: 'Forbidden: Account pending verification'
        });
    } else {
        return res.status(403).json({
            error: 'Forbidden: Access restricted to Professionals or Coaches'
        });
    }
};

// Middleware to require non-professional skill level
const requireNonProfessional = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.skillLevel !== 'non-professional') {
        return res.status(403).json({
            error: 'Forbidden: This feature is only available for non-professional players'
        });
    }

    next();
};

module.exports = { auth, optionalAuth, authorize, requireProfessional, requireNonProfessional };

