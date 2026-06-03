const User = require('../models/User');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Session = require('../models/Session');
const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const { sendAppEmail } = require('../utils/mailer');

const appName = 'SportsSphere';

const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const escapeHtml = (value) => {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const buildEmailHtml = ({ title, message, details = [] }) => {
    const rows = details
        .filter((item) => item && item.value !== undefined && item.value !== null && item.value !== '')
        .map((item) => `
            <tr>
                <td style="padding: 8px 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.label)}</td>
                <td style="padding: 8px 12px; color: #111827; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${escapeHtml(item.value)}</td>
            </tr>
        `)
        .join('');

    return `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
            <h2 style="margin: 0 0 12px;">${escapeHtml(title)}</h2>
            <p>${escapeHtml(message)}</p>
            ${rows ? `<table style="border-collapse: collapse; margin-top: 16px; width: 100%; max-width: 560px;">${rows}</table>` : ''}
            <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">This is an automated ${appName} notification.</p>
        </div>
    `;
};

const buildEmailText = ({ title, message, details = [] }) => {
    const detailLines = details
        .filter((item) => item && item.value !== undefined && item.value !== null && item.value !== '')
        .map((item) => `${item.label}: ${item.value}`)
        .join('\n');

    return `${title}\n\n${message}${detailLines ? `\n\n${detailLines}` : ''}\n\nThis is an automated ${appName} notification.`;
};

const resolveUser = async (userOrId) => {
    if (!userOrId) return null;
    if (userOrId.email) return userOrId;
    const id = userOrId._id || userOrId;
    return User.findById(id).select('name email role status').lean();
};

const sendToUser = async (userOrId, payload, context) => {
    try {
        const user = await resolveUser(userOrId);
        if (!user?.email) {
            console.warn('[EmailNotification] Skipped email: missing recipient email', { context, userId: user?._id || userOrId });
            return;
        }

        const emailPayload = {
            to: user.email,
            subject: payload.subject,
            text: buildEmailText(payload),
            html: buildEmailHtml(payload)
        };

        await sendAppEmail(emailPayload);
        console.log('[EmailNotification] Email sent', {
            context,
            userId: user._id,
            email: user.email,
            subject: payload.subject
        });
    } catch (error) {
        console.error('[EmailNotification] Email failed', {
            context,
            userId: userOrId?._id || userOrId,
            subject: payload.subject,
            code: error.code,
            responseCode: error.responseCode,
            response: error.response,
            message: error.message
        });
    }
};

const notifyUserStatusChanged = async (userOrId, status, reason) => {
    const isApproved = status === 'approved';
    const title = isApproved ? 'Your SportsSphere profile is approved' : 'Your SportsSphere profile was rejected';
    const message = isApproved
        ? 'Your profile verification has been approved. You can now continue using SportsSphere.'
        : 'Your profile verification was rejected. Please review the reason and update your profile if needed.';

    await sendToUser(userOrId, {
        subject: title,
        title,
        message,
        details: [
            { label: 'Status', value: status },
            { label: 'Reason', value: reason }
        ]
    }, 'user_status_changed');
};

const notifyIncomingRequest = async ({ recipientId, requesterId, bookingId, requestType = 'sparring/coaching' }) => {
    const requester = await resolveUser(requesterId);
    const booking = bookingId
        ? await Booking.findById(bookingId).populate('court', 'name location').lean()
        : null;

    await sendToUser(recipientId, {
        subject: `New ${requestType} request`,
        title: `New ${requestType} request`,
        message: 'You received a new request. Please respond from your SportsSphere dashboard.',
        details: [
            { label: 'Requester', value: requester?.name || requester?.email },
            { label: 'Date', value: formatDate(booking?.date) },
            { label: 'Time', value: booking ? `${booking.startTime} - ${booking.endTime}` : '' },
            { label: 'Court', value: booking?.court?.name }
        ]
    }, 'incoming_request');
};

const notifyRequestStatusChanged = async ({ requesterId, responderId, bookingId, status }) => {
    const responder = await resolveUser(responderId);
    const booking = bookingId
        ? await Booking.findById(bookingId).populate('court', 'name location').lean()
        : null;
    const accepted = status === 'ACCEPTED';

    await sendToUser(requesterId, {
        subject: accepted ? 'Your request was accepted' : 'Your request was rejected',
        title: accepted ? 'Request accepted' : 'Request rejected',
        message: accepted
            ? 'Your request was accepted. Please complete payment to confirm the booking.'
            : 'Your request was rejected or cancelled by the professional.',
        details: [
            { label: 'Responder', value: responder?.name || responder?.email },
            { label: 'Status', value: status },
            { label: 'Date', value: formatDate(booking?.date) },
            { label: 'Time', value: booking ? `${booking.startTime} - ${booking.endTime}` : '' },
            { label: 'Court', value: booking?.court?.name }
        ]
    }, 'request_status_changed');
};

const notifyCoachingSessionRequest = async ({ sessionId, requesterId }) => {
    const session = await Session.findById(sessionId)
        .populate('coach', 'name email')
        .populate('students', 'name email')
        .populate({ path: 'court', select: 'name location owner', populate: { path: 'owner', select: 'name email' } })
        .lean();

    if (!session) return;

    const requester = await resolveUser(requesterId);
    const details = [
        { label: 'Requester', value: requester?.name || requester?.email },
        { label: 'Court', value: session.court?.name },
        { label: 'Date', value: formatDate(session.date) },
        { label: 'Time', value: `${session.startTime} - ${session.endTime}` },
        { label: 'Plan', value: session.planType },
        { label: 'Price', value: session.totalPrice ? `PKR ${session.totalPrice}` : '' }
    ];

    await sendToUser(session.coach, {
        subject: 'New coaching session request',
        title: 'New coaching session request',
        message: 'A player requested one of your coaching sessions. Please respond from your SportsSphere dashboard.',
        details
    }, 'coaching_request_coach');

    if (session.court?.owner) {
        await sendToUser(session.court.owner, {
            subject: 'Coaching request at your court',
            title: 'Coaching request at your court',
            message: 'A player requested a coaching session at your court.',
            details
        }, 'coaching_request_court_owner');
    }
};

const notifyCoachingSessionStudents = async (sessionOrId, { title, message, status }) => {
    const session = await Session.findById(sessionOrId._id || sessionOrId)
        .populate('coach', 'name email')
        .populate('students', 'name email')
        .populate('court', 'name location')
        .lean();

    if (!session) return;

    const details = [
        { label: 'Coach', value: session.coach?.name || session.coach?.email },
        { label: 'Status', value: status },
        { label: 'Court', value: session.court?.name },
        { label: 'Date', value: formatDate(session.date) },
        { label: 'Time', value: `${session.startTime} - ${session.endTime}` },
        { label: 'Price', value: session.totalPrice ? `PKR ${session.totalPrice}` : '' }
    ];

    for (const student of session.students || []) {
        await sendToUser(student, {
            subject: title,
            title,
            message,
            details
        }, 'coaching_session_student_status');
    }
};

const notifyBookingCreated = async (bookingOrId) => {
    const booking = await Booking.findById(bookingOrId._id || bookingOrId)
        .populate('user', 'name email')
        .populate('proPlayer', 'name email')
        .populate({ path: 'court', select: 'name location owner', populate: { path: 'owner', select: 'name email' } })
        .lean();

    if (!booking) return;

    const details = [
        { label: 'Court', value: booking.court?.name },
        { label: 'Date', value: formatDate(booking.date) },
        { label: 'Time', value: `${booking.startTime} - ${booking.endTime}` },
        { label: 'Status', value: booking.status },
        { label: 'Total price', value: booking.totalPrice ? `PKR ${booking.totalPrice}` : '' }
    ];

    await sendToUser(booking.user, {
        subject: 'Court booking created',
        title: 'Court booking created',
        message: 'Your court booking has been created. Complete payment if required to confirm it.',
        details
    }, 'booking_created_user');

    if (booking.court?.owner) {
        await sendToUser(booking.court.owner, {
            subject: 'New court booking',
            title: 'New court booking',
            message: 'A player created a booking for your court.',
            details: [
                { label: 'Player', value: booking.user?.name || booking.user?.email },
                ...details
            ]
        }, 'booking_created_court_owner');
    }
};

const notifyBookingConfirmed = async (bookingOrId) => {
    const booking = await Booking.findById(bookingOrId._id || bookingOrId)
        .populate('user', 'name email')
        .populate('proPlayer', 'name email')
        .populate({ path: 'court', select: 'name location owner', populate: { path: 'owner', select: 'name email' } })
        .lean();

    if (!booking) return;

    const details = [
        { label: 'Court', value: booking.court?.name },
        { label: 'Date', value: formatDate(booking.date) },
        { label: 'Time', value: `${booking.startTime} - ${booking.endTime}` },
        { label: 'Payment', value: booking.paymentStatus },
        { label: 'Total price', value: booking.totalPrice ? `PKR ${booking.totalPrice}` : '' }
    ];

    const recipients = [booking.user, booking.court?.owner, booking.proPlayer].filter(Boolean);
    const seen = new Set();

    for (const recipient of recipients) {
        const id = String(recipient._id || recipient);
        if (seen.has(id)) continue;
        seen.add(id);

        await sendToUser(recipient, {
            subject: 'Booking confirmed',
            title: 'Booking confirmed',
            message: 'The booking is confirmed.',
            details
        }, 'booking_confirmed');
    }
};

const getRegistrationRecipients = (registration) => {
    return [registration.player, registration.player1, registration.player2].filter(Boolean);
};

const notifyTournamentRegistrationCreated = async (registrationOrId) => {
    const registration = await TournamentRegistration.findById(registrationOrId._id || registrationOrId)
        .populate('player', 'name email')
        .populate('player1', 'name email')
        .populate('player2', 'name email')
        .populate({ path: 'tournament', select: 'name startDate venue city organizer', populate: { path: 'organizer', select: 'name email' } })
        .lean();

    if (!registration) return;

    const details = [
        { label: 'Tournament', value: registration.tournament?.name },
        { label: 'Category', value: registration.category },
        { label: 'Start date', value: formatDate(registration.tournament?.startDate) },
        { label: 'Venue', value: registration.tournament?.venue },
        { label: 'Status', value: registration.status },
        { label: 'Payment', value: registration.paymentStatus }
    ];

    for (const player of getRegistrationRecipients(registration)) {
        await sendToUser(player, {
            subject: 'Tournament registration received',
            title: 'Tournament registration received',
            message: 'Your tournament registration has been received.',
            details
        }, 'tournament_registration_player');
    }

    if (registration.tournament?.organizer) {
        await sendToUser(registration.tournament.organizer, {
            subject: 'New tournament registration',
            title: 'New tournament registration',
            message: 'A player registered for your tournament.',
            details
        }, 'tournament_registration_organizer');
    }
};

const notifyTournamentRegistrationConfirmed = async (registrationOrId) => {
    const registration = await TournamentRegistration.findById(registrationOrId._id || registrationOrId)
        .populate('player', 'name email')
        .populate('player1', 'name email')
        .populate('player2', 'name email')
        .populate({ path: 'tournament', select: 'name startDate venue city organizer', populate: { path: 'organizer', select: 'name email' } })
        .lean();

    if (!registration) return;

    const details = [
        { label: 'Tournament', value: registration.tournament?.name },
        { label: 'Category', value: registration.category },
        { label: 'Start date', value: formatDate(registration.tournament?.startDate) },
        { label: 'Venue', value: registration.tournament?.venue },
        { label: 'Payment', value: registration.paymentStatus }
    ];

    for (const player of getRegistrationRecipients(registration)) {
        await sendToUser(player, {
            subject: 'Tournament registration confirmed',
            title: 'Tournament registration confirmed',
            message: 'Your tournament payment is complete and registration is confirmed.',
            details
        }, 'tournament_registration_confirmed');
    }
};

const notifyTournamentPublished = async (tournamentOrId) => {
    const tournament = await Tournament.findById(tournamentOrId._id || tournamentOrId).lean();
    if (!tournament) return;

    const players = await User.find({
        role: 'player',
        status: { $in: ['approved', 'waiting_for_approval', 'pending'] },
        email: { $exists: true, $ne: '' }
    }).select('name email').lean();

    const payload = {
        subject: `New tournament open: ${tournament.name}`,
        title: 'New tournament open for registration',
        message: 'A new tournament is open for registration on SportsSphere.',
        details: [
            { label: 'Tournament', value: tournament.name },
            { label: 'Start date', value: formatDate(tournament.startDate) },
            { label: 'Registration deadline', value: formatDate(tournament.registrationDeadline) },
            { label: 'Venue', value: tournament.venue },
            { label: 'City', value: tournament.city }
        ]
    };

    console.log('[EmailNotification] Sending tournament publish emails', {
        tournamentId: tournament._id,
        recipients: players.length
    });

    for (const player of players) {
        await sendToUser(player, payload, 'tournament_published_player');
    }
};

const safeEmailTask = async (context, task) => {
    try {
        return await task();
    } catch (error) {
        console.error('[EmailNotification] Task failed', {
            context,
            code: error.code,
            responseCode: error.responseCode,
            response: error.response,
            message: error.message,
            stack: error.stack
        });
    }
};

module.exports = {
    notifyUserStatusChanged: (...args) => safeEmailTask('notifyUserStatusChanged', () => notifyUserStatusChanged(...args)),
    notifyIncomingRequest: (...args) => safeEmailTask('notifyIncomingRequest', () => notifyIncomingRequest(...args)),
    notifyRequestStatusChanged: (...args) => safeEmailTask('notifyRequestStatusChanged', () => notifyRequestStatusChanged(...args)),
    notifyCoachingSessionRequest: (...args) => safeEmailTask('notifyCoachingSessionRequest', () => notifyCoachingSessionRequest(...args)),
    notifyCoachingSessionStudents: (...args) => safeEmailTask('notifyCoachingSessionStudents', () => notifyCoachingSessionStudents(...args)),
    notifyBookingCreated: (...args) => safeEmailTask('notifyBookingCreated', () => notifyBookingCreated(...args)),
    notifyBookingConfirmed: (...args) => safeEmailTask('notifyBookingConfirmed', () => notifyBookingConfirmed(...args)),
    notifyTournamentRegistrationCreated: (...args) => safeEmailTask('notifyTournamentRegistrationCreated', () => notifyTournamentRegistrationCreated(...args)),
    notifyTournamentRegistrationConfirmed: (...args) => safeEmailTask('notifyTournamentRegistrationConfirmed', () => notifyTournamentRegistrationConfirmed(...args)),
    notifyTournamentPublished: (...args) => safeEmailTask('notifyTournamentPublished', () => notifyTournamentPublished(...args))
};
