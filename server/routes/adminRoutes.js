const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getAllUsers,
    updateUser,
    getPendingUsers,
    getUserDetails,
    approveUser,
    rejectUser,
    getAllBookings,
    getAllTournaments,
    deleteTournament,
    getAllCourts,
    deleteCourt
} = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(auth);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/pending', getPendingUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id', updateUser);
router.put('/users/:id/approve', approveUser);
router.put('/users/:id/reject', rejectUser);
router.get('/bookings', getAllBookings);
router.get('/tournaments', getAllTournaments);
router.delete('/tournaments/:id', deleteTournament);
router.get('/courts', getAllCourts);
router.delete('/courts/:id', deleteCourt);

module.exports = router;
