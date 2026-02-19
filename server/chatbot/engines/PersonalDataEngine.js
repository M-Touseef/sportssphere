const IIntentResolver = require('../interfaces/IIntentResolver');
const chatDataService = require('../../services/chatDataService');

/**
 * PersonalDataEngine - Handles "Personal" queries (DB Access)
 * 
 * Interprets user intent to fetch specific personal data:
 * - My Matches
 * - My Bookings
 * - My Tournaments
 */
class PersonalDataEngine extends IIntentResolver {
    constructor() {
        super();
        this.chatDataService = chatDataService;

        // Define explicit personal intents mapping
        this.intentMap = {
            'matches': ['match', 'game', 'schedule'],
            'bookings': ['booking', 'court', 'reservation'],
            'tournaments': ['tournament', 'competition'],
            'results': ['result', 'score', 'win', 'loss']
        };
    }

    /**
     * Resolve intent for personal data
     * @param {string} message 
     * @param {Object} context 
     */
    async resolveIntent(message, context = {}) {
        if (!context.userId) {
            return {
                intentId: 'AUTH_REQUIRED',
                confidence: 1.0,
                actionType: 'STATIC_RESPONSE',
                response: "You need to be logged in to view your personal information."
            };
        }

        const normalized = message.toLowerCase();
        let dataQuery = null;
        let intentId = 'UNKNOWN_PERSONAL';

        // Identify data category
        if (this.matchesCategory(normalized, 'matches')) {
            dataQuery = 'matches';
            intentId = 'MY_MATCHES';
        } else if (this.matchesCategory(normalized, 'bookings')) {
            dataQuery = 'bookings';
            intentId = 'MY_BOOKINGS';
        } else if (this.matchesCategory(normalized, 'tournaments')) {
            dataQuery = 'tournaments';
            intentId = 'MY_TOURNAMENTS';
        } else if (this.matchesCategory(normalized, 'results')) {
            dataQuery = 'results';
            intentId = 'MY_RESULTS';
        }

        if (dataQuery) {
            // Fetch data directly
            try {
                const dataResponse = await this.chatDataService.handleUserQuery(context.userId, dataQuery);
                return {
                    intentId: intentId,
                    confidence: 1.0,
                    actionType: 'STATIC_RESPONSE', // We return the data as the response
                    response: dataResponse || "I couldn't find any data for that request.",
                    dataQuery: dataQuery,
                    processingTimeMs: 0
                };
            } catch (error) {
                console.error('[PersonalDataEngine] DB Error:', error);
                return {
                    intentId: 'DB_ERROR',
                    confidence: 1.0,
                    actionType: 'STATIC_RESPONSE',
                    response: "I encountered an error accessing your data. Please try again later."
                };
            }
        }

        // Fallback if we know it's personal but can't pinpoint exact category
        return {
            intentId: 'PERSONAL_FALLBACK',
            confidence: 0.5,
            actionType: 'STATIC_RESPONSE',
            response: "I see you're asking about your personal data, but I'm not sure if you mean matches, bookings, or tournaments. Could you be more specific?"
        };
    }

    matchesCategory(text, category) {
        return this.intentMap[category].some(keyword => text.includes(keyword));
    }

    getEngineName() { return 'PersonalDataEngine'; }
    async isReady() { return true; }
}

module.exports = PersonalDataEngine;
