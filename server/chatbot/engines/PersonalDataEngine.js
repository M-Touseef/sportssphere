const IIntentResolver = require('../interfaces/IIntentResolver');
const chatDataService = require('../../services/chatDataService');

/**
 * PersonalDataEngine - Fetches logged-in user's data from MongoDB
 */
class PersonalDataEngine extends IIntentResolver {
    constructor() {
        super();
        this.chatDataService = chatDataService;

        this.intentMap = {
            results: ['result', 'results', 'score', 'win', 'loss', 'won'],
            sessions: ['session', 'sessions', 'lesson', 'lessons'],
            bookings: ['booking', 'bookings', 'reservation', 'reserved'],
            tournaments: ['tournament', 'tournaments', 'competition', 'registered'],
            matches: ['match', 'matches', 'game', 'games', 'opponent']
        };
    }

    async resolveIntent(message, context = {}) {
        if (!context.userId) {
            return {
                intentId: 'AUTH_REQUIRED',
                confidence: 1.0,
                actionType: 'STATIC_RESPONSE',
                response: 'Please log in to view your bookings, matches, and tournaments.',
                source: 'database'
            };
        }

        const normalized = message.toLowerCase();
        let dataQuery = null;
        let intentId = 'UNKNOWN_PERSONAL';

        if (
            this.matchesCategory(normalized, 'results') ||
            /\bmatch\s+results?\b/i.test(normalized)
        ) {
            dataQuery = 'results';
            intentId = 'MY_RESULTS';
        } else if (
            this.matchesCategory(normalized, 'sessions') ||
            /\b(coaching|coach)\s+sessions?\b/i.test(normalized)
        ) {
            dataQuery = 'sessions';
            intentId = 'MY_SESSIONS';
        } else if (this.matchesCategory(normalized, 'bookings')) {
            dataQuery = 'bookings';
            intentId = 'MY_BOOKINGS';
        } else if (this.matchesCategory(normalized, 'tournaments')) {
            dataQuery = 'tournaments';
            intentId = 'MY_TOURNAMENTS';
        } else if (
            this.matchesCategory(normalized, 'matches') ||
            /\bmy\b.*\b(schedule|next)\b/i.test(normalized)
        ) {
            dataQuery = 'matches';
            intentId = 'MY_MATCHES';
        }

        if (dataQuery) {
            try {
                const dataResponse = await this.chatDataService.handleUserQuery(context.userId, dataQuery);
                return {
                    intentId,
                    confidence: 1.0,
                    actionType: 'STATIC_RESPONSE',
                    response: dataResponse || "I couldn't find any records for that request.",
                    source: 'database',
                    dataQuery,
                    processingTimeMs: 0
                };
            } catch (error) {
                console.error('[PersonalDataEngine] DB Error:', error);
                return {
                    intentId: 'DB_ERROR',
                    confidence: 1.0,
                    actionType: 'STATIC_RESPONSE',
                    response: 'I encountered an error accessing your data. Please try again later.',
                    source: 'database'
                };
            }
        }

        return {
            intentId: 'PERSONAL_FALLBACK',
            confidence: 0.5,
            actionType: 'STATIC_RESPONSE',
            response: "I can look up your matches, court bookings, tournaments, or coaching sessions. Which would you like?",
            source: 'database'
        };
    }

    matchesCategory(text, category) {
        return this.intentMap[category].some((keyword) => text.includes(keyword));
    }

    getEngineName() { return 'PersonalDataEngine'; }
    async isReady() { return true; }
}

module.exports = PersonalDataEngine;
