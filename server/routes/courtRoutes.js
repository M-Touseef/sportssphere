const express = require('express');
const router = express.Router();
const { getCourts, getCourt, createCourt, getAvailability, updateCourt, deleteCourt, getMyCourts, getOwnerOverview, getOwnerCourtDetails } = require('../controllers/courtController');
const { auth, authorize } = require('../middleware/auth');

// Public routes
// Place specific routes before generic :id parameter routes
router.get('/', getCourts);
router.get('/:id/availability', getAvailability);
router.get('/my/overview', auth, authorize('organizer', 'admin'), getOwnerOverview);
router.get('/my/:id/details', auth, authorize('organizer', 'admin'), getOwnerCourtDetails);
router.get('/my/all', auth, authorize('organizer', 'admin'), getMyCourts);
router.get('/:id', getCourt);

// Protected routes
router.use(auth); // Protect all routes defined after this
router.post('/', authorize('organizer', 'admin'), createCourt);
router.put('/:id', authorize('organizer', 'admin'), updateCourt);
router.delete('/:id', authorize('organizer', 'admin'), deleteCourt);

module.exports = router;
