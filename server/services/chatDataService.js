const Tournament = require('../models/Tournament');
const Registration = require('../models/TournamentRegistration');
const Match = require('../models/Match');
const Booking = require('../models/Booking');
// const SparringRequest = require('../models/SparringRequest'); // Legacy removed
const Session = require('../models/Session');

/**
 * Service to fetch user-specific data for chatbot responses
 */
class ChatDataService {

    // Get user's upcoming matches
    async getUserMatches(userId) {
        try {
            const matches = await Match.find({
                $or: [
                    { 'participant1.registration': { $exists: true } },
                    { 'participant2.registration': { $exists: true } }
                ],
                status: { $in: ['scheduled', 'in_progress'] }
            })
                .populate({
                    path: 'tournament',
                    select: 'name venue startDate'
                })
                .populate({
                    path: 'participant1.registration participant2.registration',
                    populate: { path: 'player', select: 'name' }
                })
                .sort({ scheduledTime: 1 })
                .limit(5);

            // Filter to only matches where user is participating
            const userMatches = matches.filter(match => {
                const p1Player = match.participant1.registration?.player?._id;
                const p2Player = match.participant2.registration?.player?._id;
                return p1Player?.toString() === userId || p2Player?.toString() === userId;
            });

            return userMatches;
        } catch (error) {
            console.error('Error fetching user matches:', error);
            return [];
        }
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
                status: { $in: ['pending', 'confirmed'] }
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

    // Get user's match results (recent completed matches)
    async getUserMatchResults(userId) {
        try {
            const matches = await Match.find({
                $or: [
                    { 'participant1.registration': { $exists: true } },
                    { 'participant2.registration': { $exists: true } }
                ],
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

            // Filter to only matches where user participated
            const userMatches = matches.filter(match => {
                const p1Player = match.participant1.registration?.player?._id;
                const p2Player = match.participant2.registration?.player?._id;
                return p1Player?.toString() === userId || p2Player?.toString() === userId;
            });

            return userMatches;
        } catch (error) {
            console.error('Error fetching match results:', error);
            return [];
        }
    }

    // Format matches for chat response
    formatMatchesResponse(matches) {
        if (matches.length === 0) {
            return "You don't have any upcoming matches scheduled.";
        }

        let response = `You have ${matches.length} upcoming match${matches.length > 1 ? 'es' : ''}:\n\n`;

        matches.forEach((match, index) => {
            const opponent = this.getOpponentName(match);
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
            const opponent = this.getOpponentName(match);
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

    // Helper: Get opponent name from match
    getOpponentName(match) {
        // This is simplified - in real implementation, check which participant is the current user
        const p1Name = match.participant1.registration?.player?.name ||
            match.participant1.registration?.teamName || 'TBD';
        const p2Name = match.participant2.registration?.player?.name ||
            match.participant2.registration?.teamName || 'TBD';

        // Return both for now, in real use we'd return only the opponent
        return `${p1Name} vs ${p2Name}`;
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

    // Main function to handle user data queries
    async handleUserQuery(userId, intent) {
        switch (intent) {
            case 'matches':
            case 'next_match':
                const matches = await this.getUserMatches(userId);
                return this.formatMatchesResponse(matches);

            case 'tournaments':
            case 'my_tournaments':
                const tournaments = await this.getUserTournaments(userId);
                return this.formatTournamentsResponse(tournaments);

            case 'bookings':
            case 'reservations':
                const bookings = await this.getUserBookings(userId);
                return this.formatBookingsResponse(bookings);

            case 'results':
            case 'match_results':
                const results = await this.getUserMatchResults(userId);
                const resultsResp = this.formatResultsResponse(results, userId);
                return resultsResp; // formatResultsResponse internally uses userId

            default:
                return null;
        }
    }

    // Handle Public Data Queries
    async handlePublicQuery(intent) {
        switch (intent) {
            case 'public_tournaments':
                const tourneys = await this.getPublicTournaments();
                return this.formatPublicTournamentsResponse(tourneys);

            case 'public_results':
                const results = await this.getPublicMatchResults();
                return this.formatPublicResultsResponse(results);

            default:
                return null;
        }
    }
}

module.exports = new ChatDataService();
