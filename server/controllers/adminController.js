const User = require('../models/User');
const Booking = require('../models/Booking');
const Tournament = require('../models/Tournament');
const Court = require('../models/Court');
const Session = require('../models/Session');

// @desc    Get system-wide statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
    try {
        const stats = {
            users: {
                total: await User.countDocuments(),
                players: await User.countDocuments({ role: 'player' }),
                coaches: await User.countDocuments({ role: 'coach' }),
                organizers: await User.countDocuments({ role: 'organizer' }),
                pendingVerification: await User.countDocuments({ status: 'waiting_for_approval' })
            },
            bookings: {
                total: await Booking.countDocuments(),
                active: await Booking.countDocuments({ status: 'confirmed' }),
                revenue: 0 // Aggregate below
            },
            tournaments: {
                total: await Tournament.countDocuments(),
                active: await Tournament.countDocuments({ status: { $in: ['registration_open', 'in_progress'] } }),
            },
            sessions: {
                total: await Session.countDocuments(),
                completed: await Session.countDocuments({ status: 'completed' })
            }
        };

        // Calculate revenue from active bookings
        // Note: Real app would have proper transaction table
        const bookingRevenue = await Booking.aggregate([
            { $match: { status: 'confirmed', paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        // Calculate revenue from tournament registrations (if entry fee logic exists clearly in db, usually simpler)
        // Leaving simple for now

        stats.bookings.revenue = bookingRevenue.length > 0 ? bookingRevenue[0].total : 0;

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res, next) => {
    try {
        const { role, verified, search } = req.query;
        let query = {};

        if (role) query.role = role;
        if (verified) query.verified = verified === 'true';

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user status (verify/role)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
    try {
        const { role, verified, status } = req.body;
        const updates = {};

        if (role) updates.role = role;
        if (verified !== undefined) updates.verified = verified;
        if (status) updates.status = status;
        if (req.body.rejectionReason) updates.rejectionReason = req.body.rejectionReason;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get users pending verification
// @route   GET /api/admin/users/pending
// @access  Private (Admin)
exports.getPendingUsers = async (req, res, next) => {
    try {
        const users = await User.find({ status: 'waiting_for_approval' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUserDetails = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve a user
// @route   PUT /api/admin/users/:id/approve
// @access  Private (Admin)
exports.approveUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved',
                verified: true,
                rejectionReason: null // Clear any previous rejection reason
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'User approved successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject a user
// @route   PUT /api/admin/users/:id/reject
// @access  Private (Admin)
exports.rejectUser = async (req, res, next) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                status: 'rejected',
                verified: false,
                rejectionReason: reason
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'User rejected',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all bookings (Admin view)
// @route   GET /api/admin/bookings
// @access  Private (Admin)
exports.getAllBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate('court', 'name location')
            .sort({ date: -1 })
            .limit(100); // Limit for performance

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tournaments (Admin view - includes drafts)
// @route   GET /api/admin/tournaments
// @access  Private (Admin)
exports.getAllTournaments = async (req, res, next) => {
    try {
        const tournaments = await Tournament.find()
            .populate('organizer', 'name email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: tournaments.length,
            data: tournaments
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Get all courts (Admin view)
// @route   GET /api/admin/courts
// @access  Private (Admin)
exports.getAllCourts = async (req, res, next) => {
    try {
        const courts = await Court.find()
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: courts.length,
            data: courts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a court
// @route   DELETE /api/admin/courts/:id
// @access  Private (Admin)
exports.deleteCourt = async (req, res, next) => {
    try {
        const court = await Court.findByIdAndDelete(req.params.id);

        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Court removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a tournament
// @route   DELETE /api/admin/tournaments/:id
// @access  Private (Admin)
exports.deleteTournament = async (req, res, next) => {
    try {
        const tournament = await Tournament.findByIdAndDelete(req.params.id);

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Tournament removed successfully'
        });
    } catch (error) {
        next(error);
    }
};
