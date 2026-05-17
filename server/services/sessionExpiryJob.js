const Session = require('../models/Session');
const SparringSessionRequest = require('../models/SparringSessionRequest');
const Booking = require('../models/Booking');
const { createNotification } = require('../controllers/notificationController');
const { notifySparringRequester } = require('../controllers/sparringAvailabilityController');

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
                console.error('Failed to create auto-reject notification:', err);
            })
        )
    );
};

const expirePendingCoachSessions = async () => {
    const now = new Date();
    const expired = await Session.find({
        status: 'pending',
        responseDeadline: { $lte: now },
        students: { $exists: true, $not: { $size: 0 } }
    });

    for (const session of expired) {
        session.status = 'cancelled';
        session.responseDeadline = undefined;
        await session.save();

        await notifySessionStudents(session, {
            title: 'Coaching Request Expired',
            message: 'The coach did not confirm your request within 30 minutes. It was automatically declined.',
            status: 'REJECTED'
        });
    }

    if (expired.length > 0) {
        console.log(`Auto-rejected ${expired.length} expired coaching session request(s)`);
    }
};

const expirePendingSparringRequests = async () => {
    const now = new Date();
    const expired = await SparringSessionRequest.find({
        status: 'PENDING_RESPONSE',
        responseDeadline: { $lte: now }
    }).populate('booking');

    for (const request of expired) {
        const didReject = await request.autoReject();
        if (!didReject) continue;

        const bookingId = request.booking?._id || request.booking;
        if (bookingId) {
            await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
        }

        await notifySparringRequester(request, {
            title: 'Sparring Request Expired',
            message:
                'The professional player did not respond within 30 minutes. Your request was automatically cancelled.',
            status: 'AUTO_REJECTED'
        });
    }

    if (expired.length > 0) {
        console.log(`Auto-rejected ${expired.length} expired sparring request(s)`);
    }
};

const runExpiryJobs = async () => {
    await expirePendingCoachSessions();
    await expirePendingSparringRequests();
};

const startSessionExpiryJob = () => {
    runExpiryJobs().catch((err) => {
        console.error('Request expiry job error:', err);
    });
    setInterval(() => {
        runExpiryJobs().catch((err) => {
            console.error('Request expiry job error:', err);
        });
    }, 60 * 1000);
};

module.exports = {
    startSessionExpiryJob,
    expirePendingCoachSessions,
    expirePendingSparringRequests,
    runExpiryJobs
};
