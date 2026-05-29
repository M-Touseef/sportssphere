const Tournament = require('../models/Tournament');
const Registration = require('../models/TournamentRegistration');
const Match = require('../models/Match');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const CoachProfile = require('../models/CoachProfile');
const Session = require('../models/Session');

/**
 * Service to fetch user-specific data for chatbot responses
 */
class ChatDataService {

    normalizeUserId(userId) {
        if (!userId) return null;
        return String(userId);
    }

    /** Registration IDs for this player only — used to scope match queries */
    async getUserRegistrationIds(userId) {
        const uid = this.normalizeUserId(userId);
        if (!uid) return [];
        const registrations = await Registration.find({ player: uid }).select('_id').lean();
        return registrations.map((r) => r._id);
    }

    // Get user's upcoming matches (scoped in DB — never loads other users' matches)
    async getUserMatches(userId) {
        try {
            const regIds = await this.getUserRegistrationIds(userId);
            if (regIds.length === 0) return [];

            const matches = await Match.find({
                status: { $in: ['scheduled', 'in_progress'] },
                $or: [
                    { 'participant1.registration': { $in: regIds } },
                    { 'participant2.registration': { $in: regIds } }
                ]
            })
                .populate({ path: 'tournament', select: 'name venue startDate' })
                .populate({
                    path: 'participant1.registration participant2.registration',
                    populate: { path: 'player', select: 'name' }
                })
                .sort({ scheduledTime: 1 })
                .limit(5);

            return this.assertMatchesBelongToUser(matches, userId);
        } catch (error) {
            console.error('Error fetching user matches:', error);
            return [];
        }
    }

    assertMatchesBelongToUser(matches, userId) {
        const uid = this.normalizeUserId(userId);
        return matches.filter((match) => this.isUserInMatch(match, uid));
    }

    isUserInMatch(match, userId) {
        const p1 = match.participant1?.registration?.player?._id?.toString();
        const p2 = match.participant2?.registration?.player?._id?.toString();
        return p1 === userId || p2 === userId;
    }

    // Get user's tournament registrations and results
    async getUserTournaments(userId) {
        try {
            const registrations = await Registration.find({
                player: userId,
                status: { $in: ['confirmed', 'checked_in'] }
            })
                .populate('tournament', 'name status startDate venue')
                .sort({ createdAt: -1 })
                .limit(5);

            return registrations;
        } catch (error) {
            console.error('Error fetching user tournaments:', error);
            return [];
        }
    }

    // Get user's court bookings
    async getUserBookings(userId) {
        try {
            const now = new Date();
            const bookings = await Booking.find({
                user: userId,
                date: { $gte: now },
                status: { $in: ['pending', 'pending_pro', 'pending_payment', 'confirmed'] }
            })
                .populate('court', 'name location')
                .sort({ date: 1, startTime: 1 })
                .limit(5);

            return bookings;
        } catch (error) {
            console.error('Error fetching user bookings:', error);
            return [];
        }
    }

    // Get user's sparring matches (Logic moved to SparringAvailability/SparringSessionRequest)
    async getUserSparringMatches(userId) {
        // TODO: Update to use new SparringSessionRequest model if needed
        return [];
    }

    // Get user's coaching sessions
    async getUserSessions(userId) {
        try {
            const now = new Date();
            const sessions = await Session.find({
                player: userId,
                scheduledDate: { $gte: now },
                status: { $in: ['scheduled', 'confirmed'] }
            })
                .populate('coach', 'name specialization')
                .sort({ scheduledDate: 1 })
                .limit(5);

            return sessions;
        } catch (error) {
            console.error('Error fetching user sessions:', error);
            return [];
        }
    }

    // Get user's match results (scoped in DB)
    async getUserMatchResults(userId) {
        try {
            const regIds = await this.getUserRegistrationIds(userId);
            if (regIds.length === 0) return [];

            const matches = await Match.find({
                status: 'completed',
                $or: [
                    { 'participant1.registration': { $in: regIds } },
                    { 'participant2.registration': { $in: regIds } }
                ]
            })
                .populate({ path: 'tournament', select: 'name' })
                .populate({
                    path: 'participant1.registration participant2.registration',
                    populate: { path: 'player', select: 'name' }
                })
                .sort({ completedAt: -1 })
                .limit(5);

            return this.assertMatchesBelongToUser(matches, userId);
        } catch (error) {
            console.error('Error fetching match results:', error);
            return [];
        }
    }

    // Format matches for chat response
    formatMatchesResponse(matches, userId) {
        if (matches.length === 0) {
            return "You don't have any upcoming matches scheduled.";
        }

        let response = `You have ${matches.length} upcoming match${matches.length > 1 ? 'es' : ''}:\n\n`;

        matches.forEach((match, index) => {
            const opponent = this.getOpponentName(match, userId);
            const tournament = match.tournament?.name || 'Tournament';
            const date = match.scheduledTime ? new Date(match.scheduledTime).toLocaleDateString() : 'TBD';

            response += `${index + 1}. ${tournament}\n`;
            response += `   vs ${opponent}\n`;
            response += `   ${date}\n`;
            if (match.round) {
                response += `   Round: ${match.round.replace(/_/g, ' ')}\n`;
            }
            response += '\n';
        });

        return response.trim();
    }

    // Format tournament registrations
    formatTournamentsResponse(registrations) {
        if (registrations.length === 0) {
            return "You haven't registered for any tournaments yet. Browse available tournaments to join!";
        }

        let response = `You're registered for ${registrations.length} tournament${registrations.length > 1 ? 's' : ''}:\n\n`;

        registrations.forEach((reg, index) => {
            const tournament = reg.tournament;
            const status = tournament.status.replace('_', ' ');
            const date = new Date(tournament.startDate).toLocaleDateString();

            response += `${index + 1}. ${tournament.name}\n`;
            response += `   Status: ${status}\n`;
            response += `   Date: ${date}\n`;
            response += `   Category: ${reg.category.replace('_', ' ')}\n`;
            response += '\n';
        });

        return response.trim();
    }

    // Format bookings
    formatBookingsResponse(bookings) {
        if (bookings.length === 0) {
            return "You don't have any upcoming court bookings.";
        }

        let response = `You have ${bookings.length} upcoming booking${bookings.length > 1 ? 's' : ''}:\n\n`;

        bookings.forEach((booking, index) => {
            const court = booking.court;
            const date = new Date(booking.date).toLocaleDateString();

            response += `${index + 1}. ${court.name}\n`;
            response += `   ${date} at ${booking.startTime} - ${booking.endTime}\n`;
            response += `   Location: ${court.location.city}\n`;
            response += `   Status: ${booking.status}\n`;
            response += '\n';
        });

        return response.trim();
    }

    // Format match results
    formatResultsResponse(matches, userId) {
        if (matches.length === 0) {
            return "You don't have any completed matches yet.";
        }

        let response = `Your recent match results:\n\n`;

        matches.forEach((match, index) => {
            const isParticipant1 = match.participant1.registration?.player?._id.toString() === userId;
            const userScore = isParticipant1 ? match.participant1.score : match.participant2.score;
            const oppScore = isParticipant1 ? match.participant2.score : match.participant1.score;
            const opponent = this.getOpponentName(match, userId);
            const won = this.didUserWin(match, userId);

            response += `${index + 1}. ${match.tournament?.name || 'Match'}\n`;
            response += `   vs ${opponent}: ${won ? 'Won' : 'Lost'}\n`;
            if (userScore && oppScore) {
                response += `   Score: ${userScore.join(', ')} - ${oppScore.join(', ')}\n`;
            }
            response += '\n';
        });

        return response.trim();
    }

    // Opponent name only (never list both players as "A vs B" in personal replies)
    getOpponentName(match, userId) {
        const uid = this.normalizeUserId(userId);
        const p1 = match.participant1?.registration;
        const p2 = match.participant2?.registration;
        const p1Id = p1?.player?._id?.toString();
        const p2Id = p2?.player?._id?.toString();

        if (p1Id === uid) {
            return p2?.player?.name || p2?.teamName || 'TBD';
        }
        if (p2Id === uid) {
            return p1?.player?.name || p1?.teamName || 'TBD';
        }
        return 'Opponent';
    }

    // Helper: Check if user won the match
    didUserWin(match, userId) {
        const isParticipant1 = match.participant1.registration?.player?._id.toString() === userId;

        if (!match.participant1.score || !match.participant2.score) return false;

        const p1Sets = match.participant1.score.filter((score, i) =>
            score > match.participant2.score[i]
        ).length;
        const p2Sets = match.participant2.score.filter((score, i) =>
            score > match.participant1.score[i]
        ).length;

        return isParticipant1 ? (p1Sets > p2Sets) : (p2Sets > p1Sets);
    }

    // Get public tournaments (ongoing/upcoming)
    async getPublicTournaments() {
        try {
            const tournaments = await Tournament.find({
                status: { $in: ['open', 'in_progress', 'upcoming'] }
            })
                .sort({ startDate: 1 })
                .limit(5);

            return tournaments;
        } catch (error) {
            console.error('Error fetching public tournaments:', error);
            return [];
        }
    }

    // Get public match results (recent completed matches)
    async getPublicMatchResults() {
        try {
            const matches = await Match.find({
                status: 'completed'
            })
                .populate({
                    path: 'tournament',
                    select: 'name'
                })
                .populate({
                    path: 'participant1.registration participant2.registration',
                    populate: { path: 'player', select: 'name' }
                })
                .sort({ completedAt: -1 })
                .limit(5);

            return matches;
        } catch (error) {
            console.error('Error fetching public match results:', error);
            return [];
        }
    }

    // Format public tournaments
    formatPublicTournamentsResponse(tournaments) {
        if (tournaments.length === 0) {
            return "There are no upcoming tournaments at the moment.";
        }

        let response = `Here are some upcoming and ongoing tournaments:\n\n`;

        tournaments.forEach((tourney, index) => {
            const date = new Date(tourney.startDate).toLocaleDateString();
            const status = tourney.status.replace('_', ' ').toUpperCase();

            response += `${index + 1}. ${tourney.name}\n`;
            response += `   Date: ${date}\n`;
            response += `   Status: ${status}\n`;
            response += `   Venue: ${tourney.venue || 'TBD'}\n\n`;
        });

        return response.trim();
    }

    // Format public match results
    formatPublicResultsResponse(matches) {
        if (matches.length === 0) {
            return "No recent match results available.";
        }

        let response = `Recent match results from various tournaments:\n\n`;

        matches.forEach((match, index) => {
            const p1 = match.participant1.registration?.player?.name || 'TBD';
            const p2 = match.participant2.registration?.player?.name || 'TBD';
            const score1 = match.participant1.score?.join('-') || '0';
            const score2 = match.participant2.score?.join('-') || '0';
            const tourney = match.tournament?.name || 'Tournament';

            response += `${index + 1}. ${tourney}: ${p1} vs ${p2}\n`;
            response += `   Result: ${score1} : ${score2}\n\n`;
        });

        return response.trim();
    }

    // Main function to handle user data queries (always scoped to userId from auth token)
    async handleUserQuery(userId, intent) {
        const uid = this.normalizeUserId(userId);
        if (!uid) {
            return 'Please log in to view your personal SportSphere data.';
        }

        switch (intent) {
            case 'matches':
            case 'next_match': {
                const matches = await this.getUserMatches(uid);
                return this.formatMatchesResponse(matches, uid);
            }

            case 'tournaments':
            case 'my_tournaments': {
                const tournaments = await this.getUserTournaments(uid);
                return this.formatTournamentsResponse(tournaments);
            }
            case 'bookings':
            case 'reservations': {
                const bookings = await this.getUserBookings(uid);
                return this.formatBookingsResponse(bookings);
            }
            case 'results':
            case 'match_results': {
                const results = await this.getUserMatchResults(uid);
                return this.formatResultsResponse(results, uid);
            }
            case 'sessions':
            case 'coaching_sessions': {
                const sessions = await this.getUserSessions(uid);
                return this.formatSessionsResponse(sessions);
            }
            default:
                return null;
        }
    }

    async getPublicCourts(city) {
        try {
            const query = {};
            if (city) {
                query['location.city'] = new RegExp(city, 'i');
            }
            return await Court.find(query)
                .select('name location pricePerHour surfaceType')
                .sort({ 'location.city': 1, name: 1 })
                .limit(8);
        } catch (error) {
            console.error('Error fetching public courts:', error);
            return [];
        }
    }

    async getPublicCoaches(city) {
        try {
            const coaches = await CoachProfile.find({})
                .populate('user', 'name city')
                .sort({ experience: -1 })
                .limit(8);

            if (!city) return coaches;

            const cityLower = city.toLowerCase();
            return coaches.filter(
                (c) => c.user?.city && c.user.city.toLowerCase().includes(cityLower)
            );
        } catch (error) {
            console.error('Error fetching public coaches:', error);
            return [];
        }
    }

    formatPublicCourtsResponse(courts) {
        if (!courts.length) {
            return 'No courts are listed on SportSphere right now. Check back soon or browse the Courts page.';
        }

        let response = 'Courts available on SportSphere:\n\n';
        courts.forEach((court, index) => {
            const city = court.location?.city || 'N/A';
            response += `${index + 1}. ${court.name}\n`;
            response += `   City: ${city}\n`;
            response += `   Rate: Rs.${court.pricePerHour}/hr · Surface: ${court.surfaceType}\n\n`;
        });
        return response.trim();
    }

    formatPublicCoachesResponse(coaches) {
        if (!coaches.length) {
            return 'No coaches are listed on SportSphere right now. Visit the Coaches page to see when new profiles are added.';
        }

        let response = 'Coaches on SportSphere:\n\n';
        coaches.forEach((coach, index) => {
            const name = coach.user?.name || 'Coach';
            const city = coach.user?.city || 'N/A';
            const specs = (coach.specialization || []).slice(0, 2).join(', ') || 'General coaching';
            response += `${index + 1}. ${name}\n`;
            response += `   City: ${city} · ${coach.experience} yrs exp.\n`;
            response += `   Rate: Rs.${coach.hourlyRate}/hr · ${specs}\n\n`;
        });
        return response.trim();
    }

    formatSessionsResponse(sessions) {
        if (!sessions.length) {
            return "You don't have any upcoming coaching sessions scheduled.";
        }

        let response = 'Your upcoming coaching sessions:\n\n';
        sessions.forEach((session, index) => {
            const date = new Date(session.scheduledDate).toLocaleDateString();
            const coachName = session.coach?.name || 'Coach';
            response += `${index + 1}. ${coachName}\n`;
            response += `   Date: ${date}\n`;
            response += `   Status: ${session.status}\n\n`;
        });
        return response.trim();
    }

    extractCityHint(message) {
        const match = message.match(/\b(?:in|near|at)\s+([a-z][a-z\s]{1,30}?)(?:\?|$|\.|,)/i);
        return match ? match[1].trim() : null;
    }

    // Handle Public Data Queries
    async handlePublicQuery(intent, options = {}) {
        switch (intent) {
            case 'public_tournaments': {
                const tourneys = await this.getPublicTournaments();
                return this.formatPublicTournamentsResponse(tourneys);
            }
            case 'public_results': {
                const results = await this.getPublicMatchResults();
                return this.formatPublicResultsResponse(results);
            }
            case 'public_courts': {
                const courts = await this.getPublicCourts(options.city);
                return this.formatPublicCourtsResponse(courts);
            }
            case 'public_coaches': {
                const coaches = await this.getPublicCoaches(options.city);
                return this.formatPublicCoachesResponse(coaches);
            }
            default:
                return null;
        }
    }
}

module.exports = new ChatDataService();
