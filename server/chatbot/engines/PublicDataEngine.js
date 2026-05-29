const IIntentResolver = require('../interfaces/IIntentResolver');
const chatDataService = require('../../services/chatDataService');

/**
 * PublicDataEngine - Fetches platform data from MongoDB (no auth required)
 */
class PublicDataEngine extends IIntentResolver {
    constructor() {
        super();
        this.chatDataService = chatDataService;

        this.intentMap = {
            courts: ['court', 'courts', 'venue', 'venues', 'book a court'],
            coaches: ['coach', 'coaches', 'trainer', 'trainers'],
            tournaments: ['tournament', 'tournaments', 'competition', 'standings'],
            results: ['score', 'result', 'results', 'winner', 'who won', 'match result']
        };
    }

    async resolveIntent(message, context = {}) {
        const normalized = message.toLowerCase();
        const city = this.chatDataService.extractCityHint(message);
        let dataQuery = null;
        let intentId = 'UNKNOWN_PUBLIC';

        if (this.matchesCategory(normalized, 'courts')) {
            dataQuery = 'public_courts';
            intentId = 'PUBLIC_COURTS';
        } else if (this.matchesCategory(normalized, 'coaches')) {
            dataQuery = 'public_coaches';
            intentId = 'PUBLIC_COACHES';
        } else if (
            this.matchesCategory(normalized, 'results') ||
            /\bwho\s+won\b/i.test(normalized) ||
            /\bmatch\s+results?\b/i.test(normalized)
        ) {
            dataQuery = 'public_results';
            intentId = 'PUBLIC_RESULTS';
        } else if (this.matchesCategory(normalized, 'tournaments')) {
            dataQuery = 'public_tournaments';
            intentId = 'PUBLIC_TOURNAMENTS';
        }

        if (!dataQuery) {
            return null;
        }

        try {
            const dataResponse = await this.chatDataService.handlePublicQuery(dataQuery, { city });
            return {
                intentId,
                confidence: 1.0,
                actionType: 'STATIC_RESPONSE',
                response: dataResponse || 'No data found for that request.',
                source: 'database',
                processingTimeMs: 0
            };
        } catch (error) {
            console.error('[PublicDataEngine] Error:', error);
            return {
                intentId: 'DB_ERROR',
                confidence: 1.0,
                actionType: 'STATIC_RESPONSE',
                response: "I couldn't retrieve platform data right now. Please try again.",
                source: 'database',
                processingTimeMs: 0
            };
        }
    }

    matchesCategory(text, category) {
        return this.intentMap[category].some((keyword) => text.includes(keyword));
    }

    getEngineName() { return 'PublicDataEngine'; }
    async isReady() { return true; }
}

module.exports = PublicDataEngine;
