const Session = require('../models/Session');
const CoachProfile = require('../models/CoachProfile');
const Court = require('../models/Court');
const { createNotification } = require('./notificationController');

// @desc    Publish a coaching session (Coach creates available slot)
// @route   POST /api/sessions/publish
// @access  Private (Coach)
exports.publishSession = async (req, res) => {
    try {
        const { courtId, date, startTime, endTime, duration, planType, sessionType, notes, maxStudents } = req.body;

        if (!courtId || !date || !startTime || !endTime || !duration) {
            return res.status(400).json({ error: 'Missing required session fields' });
        }

        const coachProfile = await CoachProfile.findOne({ user: req.user.id });
        if (!coachProfile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        const courtFee = (court.pricePerHour || 0) * duration;
        const totalPrice = planType === 'monthly' ? coachProfile.monthlyFee : coachProfile.hourlyRate * duration;

        const sessionDate = new Date(date);
        sessionDate.setHours(0, 0, 0, 0);

        // Check for existing published session at same time
        const conflict = await Session.findOne({
            coach: req.user.id,
            date: sessionDate,
            startTime,
            status: { $ne: 'cancelled' }
        });

        if (conflict) {
            return res.status(400).json({ error: 'You already have a session scheduled at this time' });
        }

        const session = await Session.create({
            coach: req.user.id,
            court: courtId,
            date: sessionDate,
            startTime,
            endTime,
            duration,
            totalPrice,
            courtFee,
            planType: planType || 'hourly',
            sessionType: sessionType || 'individual',
            maxStudents: maxStudents || 1,
            notes,
            isPublished: true,
            status: 'pending' // 'pending' enrollment
        });

        res.status(201).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get available sessions for a coach
// @route   GET /api/sessions/available/:coachId
// @access  Public
exports.getAvailableSessions = async (req, res) => {
    try {
        let targetCoachId = req.params.coachId;

        // Try to resolve CoachProfile to User ID
        // Frontend sends CoachProfile ID, but Session.coach refers to User ID
        const profile = await CoachProfile.findById(req.params.coachId);
        if (profile) {
            targetCoachId = profile.user;
        }

        const sessions = await Session.find({
            coach: targetCoachId,
            isPublished: true,
            $expr: { $lt: [{ $size: "$students" }, "$maxStudents"] },
            date: { $gte: new Date().setHours(0, 0, 0, 0) }
        }).populate('court', 'name location');

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Request a published coaching session (Player side)
// @route   POST /api/sessions/:id/request
// @access  Private (Player)
exports.requestSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (!session.isPublished || (session.students.length >= session.maxStudents)) {
            return res.status(400).json({ error: 'Session is not available or full' });
        }

        // Check if already enrolled
        if (session.students.includes(req.user.id)) {
            return res.status(400).json({ error: 'You are already enrolled in this session' });
        }

        session.students.push(req.user.id);
        session.status = 'pending'; // Confirmation needed from coach
        await session.save();

        // Notify coach about incoming coaching session request.
        try {
            await createNotification({
                userId: session.coach,
                type: 'booking',
                title: 'New Coaching Session Request',
                message: 'A player requested one of your coaching sessions. Please review it.',
                meta: {
                    kind: 'incoming_coaching_request',
                    sessionId: session._id,
                    requesterId: req.user.id
                }
            });
        } catch (notifyErr) {
            console.error('Failed to create coaching request notification:', notifyErr);
        }

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Legacy bookSession placeholder or redirect to requestSession logic
exports.bookSession = exports.requestSession;


// @desc    Get my sessions (as student)
// @route   GET /api/sessions/my
// @access  Private
exports.getMySessions = async (req, res) => {
    try {
        const sessions = await Session.find({ students: { $in: [req.user.id] } })
            .populate('coach', 'name email')
            .populate('court', 'name location')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get coach's sessions
// @route   GET /api/sessions/coach
// @access  Private (Coach)
exports.getCoachSessions = async (req, res) => {
    try {
        const sessions = await Session.find({ coach: req.user.id })
            .populate('students', 'name email phone')
            .populate('court', 'name location')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Cancel session
// @route   PUT /api/sessions/:id/cancel
// @access  Private
exports.cancelSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check authorization
        if (!session.students.includes(req.user.id) &&
            session.coach.toString() !== req.user.id &&
            req.user.role !== 'admin') {
            return res.status(401).json({ error: 'Not authorized' });
        }

        session.status = 'cancelled';
        await session.save();

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Rate a session
// @route   PUT /api/sessions/:id/rate
// @access  Private (Student)
exports.rateSession = async (req, res) => {
    try {
        const { score, review } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Only student can rate
        if (!session.students.includes(req.user.id)) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        // Session must be completed
        if (session.status !== 'completed') {
            return res.status(400).json({ error: 'Can only rate completed sessions' });
        }

        // Update session rating
        session.rating = {
            score,
            review,
            createdAt: new Date()
        };
        await session.save();

        // Update coach's overall rating
        const coachProfile = await CoachProfile.findOne({ user: session.coach });
        if (coachProfile) {
            const totalRating = (coachProfile.rating.average * coachProfile.rating.count) + score;
            coachProfile.rating.count += 1;
            coachProfile.rating.average = totalRating / coachProfile.rating.count;
            await coachProfile.save();
        }

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
// @desc    Confirm a session
// @route   PUT /api/sessions/:id/confirm
// @access  Private (Coach)
exports.confirmSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Only the assigned coach can confirm
        if (session.coach.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        if (session.status !== 'pending') {
            return res.status(400).json({ error: 'Session is not pending' });
        }

        session.status = 'pending_payment';
        // session.paymentStatus = 'paid'; // In a real app, this might trigger payment capture
        await session.save();

        // Populate details for response
        await session.populate('students', 'name email');

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Reject a session
// @route   PUT /api/sessions/:id/reject
// @access  Private (Coach)
exports.rejectSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Only the assigned coach can reject
        if (session.coach.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        if (session.status !== 'pending') {
            return res.status(400).json({ error: 'Session is not pending' });
        }

        session.status = 'cancelled';
        await session.save();

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
// @desc    Get derived available slots for a coach (Recurring)
// @route   GET /api/sessions/available/recurring/:coachId
// @access  Public
exports.getCoachRealizedAvailability = async (req, res) => {
    try {
        const coachProfile = await CoachProfile.findById(req.params.coachId).populate('availability.court', 'name location');
        if (!coachProfile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const realizedSlots = [];
        const today = new Date();
        // Look ahead 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            date.setHours(0, 0, 0, 0);

            const dayName = days[date.getDay()];

            // Find all matching recurring slots for this day
            const recurringSlots = coachProfile.availability.filter(slot => slot.day === dayName);

            for (const slot of recurringSlots) {
                // Check for existing session at this specific slot
                const existingSession = await Session.findOne({
                    coach: coachProfile.user,
                    date: date,
                    startTime: slot.startTime,
                    status: { $ne: 'cancelled' }
                });

                // If no session OR session has remaining capacity
                if (!existingSession || (existingSession.students.length < existingSession.maxStudents)) {
                    realizedSlots.push({
                        _id: existingSession ? existingSession._id : `${dayName}-${date.getTime()}-${slot.startTime}`,
                        date: date,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        court: slot.court,
                        maxStudents: existingSession ? existingSession.maxStudents : (slot.maxStudents || 1),
                        enrolledCount: existingSession ? existingSession.students.length : 0,
                        isRecurring: true,
                        isExisting: !!existingSession
                    });
                }
            }
        }

        res.status(200).json({
            success: true,
            count: realizedSlots.length,
            data: realizedSlots
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Request a session from a recurring slot
// @route   POST /api/sessions/request/recurring
// @access  Private (Student)
exports.requestRecurringSession = async (req, res) => {
    try {
        const { coachId, date, startTime, endTime, courtId, planType, message } = req.body;

        // Verify coach exists
        const coachProfile = await CoachProfile.findOne({ user: coachId });
        if (!coachProfile) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        const sessionDate = new Date(date);
        sessionDate.setHours(0, 0, 0, 0);

        // Double check availability
        const conflict = await Session.findOne({
            coach: coachId,
            date: sessionDate,
            startTime,
            status: { $ne: 'cancelled' }
        });

        if (conflict) {
            // Check if conflict is actually just this session being full or available for more students
            // But requestRecurringSession creates a NEW session. 
            // If it creates a NEW session every time, then it's not a group session yet.
            // A group session should probably be 'published' first.
            // If it's a 'request' for a recurring slot, maybe it should check if a session already exists for that slot.

            if (conflict.students.length >= conflict.maxStudents) {
                return res.status(400).json({ error: 'Slot is already full' });
            }

            // If session exists and has space, join it
            if (conflict.students.includes(req.user.id)) {
                return res.status(400).json({ error: 'You are already enrolled' });
            }

            conflict.students.push(req.user.id);
            await conflict.save();

            // Notify coach about incoming coaching session request.
            try {
                await createNotification({
                    userId: conflict.coach,
                    type: 'booking',
                    title: 'New Coaching Session Request',
                    message: 'A player requested one of your coaching sessions. Please review it.',
                    meta: {
                        kind: 'incoming_coaching_request',
                        sessionId: conflict._id,
                        requesterId: req.user.id
                    }
                });
            } catch (notifyErr) {
                console.error('Failed to create coaching request notification:', notifyErr);
            }

            return res.status(200).json({ success: true, data: conflict });
        }

        // Calculate price
        // Simple duration calculation assuming standard formats like "HH:MM"
        const start = parseInt(startTime.split(':')[0]);
        const end = parseInt(endTime.split(':')[0]);
        const duration = end - start || 1;

        // Fetch Court for fee calculation
        const court = await Court.findById(courtId);
        const courtFee = (court?.pricePerHour || 0) * duration;

        const totalPrice = planType === 'monthly' ? coachProfile.monthlyFee : (coachProfile.hourlyRate * duration);

        // Find the matching recurring slot to get maxStudents
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[sessionDate.getDay()];
        const recurringSlot = coachProfile.availability.find(s => s.day === dayName && s.startTime === startTime);

        const session = await Session.create({
            coach: coachId,
            students: [req.user.id],
            court: courtId,
            date: sessionDate,
            startTime,
            endTime,
            duration,
            totalPrice,
            courtFee,
            planType: planType || 'hourly',
            maxStudents: recurringSlot?.maxStudents || 1,
            notes: message,
            status: 'pending',
            isPublished: false // Created on demand
        });

        // Notify coach about incoming coaching session request.
        try {
            await createNotification({
                userId: coachId,
                type: 'booking',
                title: 'New Coaching Session Request',
                message: 'A player requested one of your coaching sessions. Please review it.',
                meta: {
                    kind: 'incoming_coaching_request',
                    sessionId: session._id,
                    requesterId: req.user.id
                }
            });
        } catch (notifyErr) {
            console.error('Failed to create coaching request notification:', notifyErr);
        }

        res.status(201).json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Pay court fee (Coach side)
// @route   PUT /api/sessions/:id/pay-court-fee
// @access  Private (Coach)
exports.payCourtFee = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Only the assigned coach can pay
        if (session.coach.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        if (session.courtPaymentStatus === 'paid') {
            return res.status(400).json({ error: 'Court fee already paid' });
        }

        // Mock payment logic - in a real app, this would involve a payment gateway
        session.courtPaymentStatus = 'paid';
        await session.save();

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
