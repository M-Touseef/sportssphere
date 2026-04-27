const express = require('express');
const router = express.Router();
const { getCourts, getCourt, createCourt, getAvailability, updateCourt, deleteCourt, getMyCourts } = require('../controllers/courtController');
const { auth, authorize } = require('../middleware/auth');

// Public routes
// Place specific routes before generic :id parameter routes
router.get('/', getCourts);
router.get('/:id/availability', getAvailability);
router.get('/:id', getCourt);

// Protected routes
router.use(auth); // Protect all routes defined after this
router.get('/my/all', authorize('organizer', 'admin'), getMyCourts);
router.post('/', authorize('organizer', 'admin'), createCourt);
router.put('/:id', authorize('organizer', 'admin'), updateCourt);
router.delete('/:id', authorize('organizer', 'admin'), deleteCourt);

module.exports = router;
