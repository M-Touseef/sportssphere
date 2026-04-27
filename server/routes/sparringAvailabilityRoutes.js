const express = require('express');
const router = express.Router();
const { auth: protect, requireProfessional, requireNonProfessional } = require('../middleware/auth');

const controller = require('../controllers/sparringAvailabilityController');

// =============================================================================
// PUBLIC ROUTES
// =============================================================================
router.get('/professionals', controller.getProfessionalsWithAvailability);
router.get('/professionals/:id/availability', controller.getProAvailability);
router.get('/available-pros', controller.getAvailableProsForSlot);

// =============================================================================
// AVAILABILITY MANAGEMENT (Professional Only - skillLevel based)
// =============================================================================
// Recurring Availability Routes
router.post('/availability/recurring', protect, requireProfessional, controller.addRecurringSlot);
router.put('/availability/recurring/:slotId', protect, requireProfessional, controller.updateRecurringSlot);
router.get('/availability/recurring/my', protect, requireProfessional, controller.getMyRecurringAvailability);
router.delete('/availability/recurring/:slotId', protect, requireProfessional, controller.removeRecurringSlot);

// Generated Request from Booking
router.post('/request', protect, controller.sendSparringRequest);

router.post('/availability', protect, requireProfessional, controller.createAvailability); // Legacy/Override
router.get('/availability/my', protect, requireProfessional, controller.getMyAvailability);
router.put('/availability/:id', protect, requireProfessional, controller.updateAvailability);
router.delete('/availability/:id', protect, requireProfessional, controller.deleteAvailability);
router.patch('/availability/:id/toggle', protect, requireProfessional, controller.toggleAvailability);

// =============================================================================
// SPARRING REQUESTS
// =============================================================================
// Non-Professional: Send request for a slot
router.post('/request/:slotId', protect, requireNonProfessional, controller.sendSparringRequest);

// Non-Professional: View my sent requests
router.get('/requests/my', protect, controller.getMySentRequests);

// Professional: View incoming requests
router.get('/requests/incoming', protect, requireProfessional, controller.getIncomingRequests);

// Professional: Accept/Reject
router.put('/requests/:id/accept', protect, requireProfessional, controller.acceptRequest);
router.put('/requests/:id/reject', protect, requireProfessional, controller.rejectRequest);

module.exports = router;

