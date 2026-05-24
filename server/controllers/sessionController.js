const Session = require('../models/Session');
const CoachProfile = require('../models/CoachProfile');
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const { createNotification } = require('./notificationController');
const { validateCoachCourtBookingForSlot } = require('./coachCourtBookingController');
const { getBookingId, normalizeDate } = require('../utils/coachAvailabilityUtils');

const { RESPONSE_DEADLINE_MS: COACH_RESPONSE_MS } = require('../constants/responseDeadlines');

const resolveUserId = (userRef) => {
    if (!userRef) return null;
    if (typeof userRef === 'string') return userRef;
    return userRef._id || userRef;
};

const notifySessionStudents = async (session, { title, message, status }) => {
    const studentIds = (session.students || []).map((s) => resolveUserId(s)).filter(Boolean);
    await Promise.all(
        studentIds.map((studentId) =>
            createNotification({
                userId: studentId,
                type: 'booking',
                title,
                message,
                meta: {
                    kind: 'coaching_session_status',
                    status,
                    sessionId: session._id
                }
            }).catch((err) => {
                console.error('Failed to create coaching session status notification:', err);
            })
        )
    );
};

const applyPendingStudentRequest = (session) => {
    if (session.status === 'pending' && session.students?.length > 0) {
        session.responseDeadline = new Date(Date.now() + COACH_RESPONSE_MS);
    }
};

const sameSlotQuery = (coachId, sessionDate, startTime, extra = {}) => ({
    coach: coachId,
    date: sessionDate,
    startTime,
    ...extra
});

const cancelCompetingPendingSessions = async (acceptedSession) => {
    const competitors = await Session.find({
        ...sameSlotQuery(acceptedSession.coach, acceptedSession.date, acceptedSession.startTime),
        status: 'pending',
        _id: { $ne: acceptedSession._id }
    });

    for (const session of competitors) {
        session.status = 'cancelled';
        session.responseDeadline = undefined;
        await session.save();
        await notifySessionStudents(session, {
            title: 'Coaching Request Closed',
            message:
                'Another player was accepted for this time slot. Please book a different time or contact the coach.',
            status: 'REJECTED'
        });
    }
};

const notifyCourtOwnerOfSessionRequest = async (session) => {
    try {
        const court = await Court.findById(session.court).select('name owner');
        if (!court?.owner) return;

        await createNotification({
            userId: court.owner,
            type: 'booking',
            title: 'Coaching Session Request',
            message: `A player requested a coaching session at ${court.name}. Awaiting coach confirmation.`,
            meta: {
                kind: 'incoming_coaching_court_request',
                sessionId: session._id,
                courtId: court._id
            }
        });
    } catch (err) {
        console.error('Failed to notify court owner of coaching request:', err);
    }
};

const notifyCoachOfSessionRequest = async (session, requesterId) => {
    try {
        await createNotification({
            userId: session.coach,
            type: 'booking',
            title: 'New Coaching Session Request',
            message: 'A player requested one of your coaching sessions. Please respond within 30 minutes.',
            meta: {
                kind: 'incoming_coaching_request',
                sessionId: session._id,
                requesterId
            }
        });
    } catch (notifyErr) {
        console.error('Failed to create coaching request notification:', notifyErr);
    }
};

// @desc    Publish a coaching session (Coach creates available slot)
// @route   POST /api/sessions/publish
// @access  Private (Coach)
exports.publishSession = async (req, res) => {
    try {
        const { courtBookingId, date, startTime, endTime, duration, planType, sessionType, notes, maxStudents } = req.body;

        if (!courtBookingId || !date || !startTime || !endTime || !duration) {
            return res.status(400).json({
                error: 'Missing required fields. Book a court first and provide courtBookingId.'
            });
        }

        const coachProfile = await CoachProfile.findOne({ user: req.user.id });
        if (!coachProfile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        const booking = await Booking.findById(courtBookingId);
        if (!booking || booking.user.toString() !== req.user.id || booking.purpose !== 'coach_reservation') {
            return res.status(400).json({ error: 'Invalid court reservation' });
        }
        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Court reservation was cancelled' });
        }

        const courtId = booking.court.toString();
        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        const sessionDate = new Date(date);
        sessionDate.setHours(0, 0, 0, 0);
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0);

        if (sessionDate.getTime() !== bookingDate.getTime()) {
            return res.status(400).json({ error: 'Session date must match your court reservation date' });
        }
        if (startTime !== booking.startTime || endTime !== booking.endTime) {
            return res.status(400).json({ error: 'Session times must match your court reservation' });
        }

        const courtFee = (court.pricePerHour || 0) * duration;
        const totalPrice = planType === 'monthly' ? coachProfile.monthlyFee : coachProfile.hourlyRate * duration;

        const conflict = await Session.findOne({
            ...sameSlotQuery(req.user.id, sessionDate, startTime),
            status: { $in: ['confirmed', 'pending_payment', 'completed'] }
        });

        if (conflict) {
            return res.status(400).json({ error: 'You already have a session scheduled at this time' });
        }

        const session = await Session.create({
            coach: req.user.id,
            court: courtId,
            courtBooking: courtBookingId,
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
            status: 'pending'
        });

        booking.linkedSession = session._id;
        await booking.save();

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
        })
            .populate('court', 'name location')
            .lean();

        const sanitized = sessions.map(({ students, ...session }) => ({
            ...session,
            enrolledCount: Array.isArray(students) ? students.length : 0
        }));

        res.status(200).json({
            success: true,
            count: sanitized.length,
            data: sanitized
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
        session.status = 'pending';
        applyPendingStudentRequest(session);
        await session.save();

        await notifyCoachOfSessionRequest(session, req.user.id);
        await notifyCourtOwnerOfSessionRequest(session);

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

        const cancelledByCoach = session.coach.toString() === req.user.id;
        if (cancelledByCoach) {
            await notifySessionStudents(session, {
                title: 'Coaching Session Cancelled',
                message: 'Your coaching session was cancelled by the coach.',
                status: 'CANCELLED'
            });
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

        if (session.responseDeadline && new Date() > session.responseDeadline) {
            return res.status(400).json({ error: 'Response window has expired' });
        }

        session.status = 'pending_payment';
        session.responseDeadline = undefined;
        // session.paymentStatus = 'paid'; // In a real app, this might trigger payment capture
        await session.save();

        await cancelCompetingPendingSessions(session);

        // Populate details for response
        await session.populate('students', 'name email');

        await notifySessionStudents(session, {
            title: 'Coaching Request Accepted',
            message: 'Your coaching request was accepted. Please complete payment to confirm your session.',
            status: 'ACCEPTED'
        });

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

        await notifySessionStudents(session, {
            title: 'Coaching Request Cancelled',
            message: 'Your coaching request was not accepted by the coach.',
            status: 'REJECTED'
        });

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
        let coachProfile = await CoachProfile.findById(req.params.coachId)
            .populate('availability.court', 'name location')
            .populate('availability.courtBooking');

        if (!coachProfile) {
            coachProfile = await CoachProfile.findOne({ user: req.params.coachId })
                .populate('availability.court', 'name location')
                .populate('availability.courtBooking');
        }

        if (!coachProfile) {
            return res.status(404).json({ error: 'Coach profile not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeBookings = await Booking.find({
            user: coachProfile.user,
            purpose: 'coach_reservation',
            status: { $ne: 'cancelled' },
            date: { $gte: today }
        })
            .sort({ date: 1, startTime: 1 })
            .populate('court', 'name location');

        const viewerId = req.user?.id?.toString() || null;
        const realizedSlots = [];

        // Each court reservation is one calendar day — coaching hours attach to that booking only
        for (const booking of activeBookings) {
            const sessionDate = normalizeDate(booking.date);
            const bookingIdStr = booking._id.toString();

            const coachingSlots = coachProfile.availability.filter(
                (slot) => getBookingId(slot.courtBooking) === bookingIdStr
            );

            for (const slot of coachingSlots) {
                const slotTaken = await Session.findOne({
                    ...sameSlotQuery(coachProfile.user, sessionDate, slot.startTime),
                    status: { $in: ['confirmed', 'pending_payment'] }
                });
                if (slotTaken) continue;

                const publishedGroup = await Session.findOne({
                    ...sameSlotQuery(coachProfile.user, sessionDate, slot.startTime),
                    isPublished: true,
                    status: { $nin: ['cancelled'] }
                });

                const courtInfo = slot.court || booking.court;

                if (publishedGroup) {
                    if (publishedGroup.students.length >= publishedGroup.maxStudents) continue;
                    realizedSlots.push({
                        _id: publishedGroup._id,
                        date: sessionDate,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        court: courtInfo
                            ? { name: courtInfo.name, location: courtInfo.location }
                            : undefined,
                        maxStudents: publishedGroup.maxStudents,
                        enrolledCount: publishedGroup.students.length,
                        slotStatus: 'available',
                        isRecurring: false,
                        isExisting: true,
                        isGroup: true
                    });
                    continue;
                }

                const pendingRequests = await Session.find({
                    ...sameSlotQuery(coachProfile.user, sessionDate, slot.startTime),
                    status: 'pending',
                    isPublished: { $ne: true }
                }).select('_id students');

                const viewerPending = viewerId
                    ? pendingRequests.find((s) =>
                          s.students.some((studentId) => studentId.toString() === viewerId)
                      )
                    : null;

                if (viewerPending) {
                    realizedSlots.push({
                        _id: viewerPending._id,
                        date: sessionDate,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        court: courtInfo
                            ? { name: courtInfo.name, location: courtInfo.location }
                            : undefined,
                        maxStudents: 1,
                        enrolledCount: 0,
                        slotStatus: 'your_pending',
                        isRecurring: false,
                        isExisting: true,
                        isGroup: false
                    });
                    continue;
                }

                realizedSlots.push({
                    _id: `${bookingIdStr}-${slot.startTime}`,
                    date: sessionDate,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    court: courtInfo
                        ? { name: courtInfo.name, location: courtInfo.location }
                        : undefined,
                    maxStudents: slot.maxStudents || 1,
                    enrolledCount: 0,
                    slotStatus: 'available',
                    isRecurring: false,
                    isExisting: false,
                    isGroup: (slot.maxStudents || 1) > 1
                });
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

        const coachProfile = await CoachProfile.findOne({ user: coachId });
        if (!coachProfile) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        const sessionDate = new Date(date);
        sessionDate.setHours(0, 0, 0, 0);

        const bookingsOnDate = await Booking.find({
            user: coachId,
            purpose: 'coach_reservation',
            date: sessionDate,
            status: { $ne: 'cancelled' }
        });

        const coachingSlot = coachProfile.availability.find((s) => {
            if (s.startTime !== startTime) return false;
            const slotBookingId = getBookingId(s.courtBooking);
            if (!slotBookingId) return false;
            return bookingsOnDate.some((b) => b._id.toString() === slotBookingId);
        });

        if (!coachingSlot) {
            return res.status(400).json({
                error: 'No coaching session on this date and time. The coach may not have opened this court booking yet.'
            });
        }

        const slotCourtId = coachingSlot.court?._id?.toString() || coachingSlot.court?.toString();
        if (courtId && slotCourtId && courtId !== slotCourtId) {
            return res.status(400).json({ error: 'Court does not match this coaching session' });
        }

        const resolvedCourtId = slotCourtId || courtId;
        if (!resolvedCourtId) {
            return res.status(400).json({ error: 'Court is required for this coaching slot' });
        }

        const courtBookingId = getBookingId(coachingSlot.courtBooking);
        if (courtBookingId) {
            try {
                await validateCoachCourtBookingForSlot(coachId, courtBookingId, {
                    startTime,
                    endTime: endTime || coachingSlot.endTime
                });
            } catch (err) {
                return res.status(err.statusCode || 400).json({ error: err.message });
            }
        }

        const duplicateRequest = await Session.findOne({
            ...sameSlotQuery(coachId, sessionDate, startTime),
            students: req.user.id,
            status: { $in: ['pending', 'pending_payment', 'confirmed'] }
        });
        if (duplicateRequest) {
            return res.status(400).json({ error: 'You already have a request for this time slot' });
        }

        const slotBooked = await Session.findOne({
            ...sameSlotQuery(coachId, sessionDate, startTime),
            status: { $in: ['confirmed', 'pending_payment'] }
        });
        if (slotBooked) {
            return res.status(400).json({ error: 'This time slot is already booked' });
        }

        // Join only coach-published group sessions (not other players' pending requests)
        const publishedGroup = await Session.findOne({
            ...sameSlotQuery(coachId, sessionDate, startTime),
            isPublished: true,
            status: { $nin: ['cancelled'] }
        });

        if (publishedGroup) {
            if (publishedGroup.students.length >= publishedGroup.maxStudents) {
                return res.status(400).json({ error: 'Slot is already full' });
            }

            publishedGroup.students.push(req.user.id);
            publishedGroup.status = 'pending';
            applyPendingStudentRequest(publishedGroup);
            await publishedGroup.save();

            await notifyCoachOfSessionRequest(publishedGroup, req.user.id);
            await notifyCourtOwnerOfSessionRequest(publishedGroup);

            return res.status(200).json({ success: true, data: publishedGroup });
        }

        const start = parseInt(startTime.split(':')[0], 10);
        const end = parseInt((endTime || coachingSlot.endTime).split(':')[0], 10);
        const duration = end - start || 1;

        const court = await Court.findById(resolvedCourtId);
        const courtFee = (court?.pricePerHour || 0) * duration;

        const totalPrice = planType === 'monthly' ? coachProfile.monthlyFee : (coachProfile.hourlyRate * duration);

        const session = await Session.create({
            coach: coachId,
            students: [req.user.id],
            court: resolvedCourtId,
            courtBooking: courtBookingId || undefined,
            date: sessionDate,
            startTime,
            endTime: endTime || coachingSlot.endTime,
            duration,
            totalPrice,
            courtFee,
            planType: planType || 'hourly',
            maxStudents: 1,
            sessionType: 'individual',
            notes: message,
            status: 'pending',
            isPublished: false
        });

        applyPendingStudentRequest(session);
        await session.save();

        await notifyCoachOfSessionRequest(session, req.user.id);
        await notifyCourtOwnerOfSessionRequest(session);

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
