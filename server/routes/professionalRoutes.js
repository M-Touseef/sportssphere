const express = require('express');
const router = express.Router();
const { auth, requireProfessional, requireNonProfessional } = require('../middleware/auth');
const {
    createProfile,
    getMyProfile,
    updateProfile,
    getPublicProfile,
    getAllProfessionals,
    rateProfessional
} = require('../controllers/professionalProfileController');

// =============================================================================
// Professional Profile Routes
// =============================================================================

// Profile management (Professional only)
router.post('/profile', auth, requireProfessional, createProfile);
router.get('/profile/me', auth, requireProfessional, getMyProfile);
router.put('/profile', auth, requireProfessional, updateProfile);

// Public views (for non-professionals to browse)
router.get('/list', getAllProfessionals);
router.get('/:id', getPublicProfile);

// Rating (Non-professional only, after completed session)
router.post('/:id/rate', auth, requireNonProfessional, rateProfessional);

module.exports = router;
