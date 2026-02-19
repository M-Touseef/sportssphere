const IIntentResolver = require('../interfaces/IIntentResolver');
const chatDataService = require('../../services/chatDataService');

/**
 * PublicDataEngine - Handles Public Data queries (No Auth Required)
 * 
 * Fetches:
 * - Public Tournaments
 * - Match Results (General)
 */
class PublicDataEngine extends IIntentResolver {
    constructor() {
        super();
        this.chatDataService = chatDataService;

        this.intentMap = {
            'tournaments': ['tournament', 'competition', 'standings'],
            'results': ['score', 'result', 'winner', 'who won']
        };
    }

    async resolveIntent(message, context = {}) {
        const normalized = message.toLowerCase();
        let dataQuery = null;
        let intentId = 'UNKNOWN_PUBLIC';

        if (this.matchesCategory(normalized, 'tournaments')) {
            dataQuery = 'public_tournaments';
            intentId = 'PUBLIC_TOURNAMENTS';
        } else if (this.matchesCategory(normalized, 'results')) {
            dataQuery = 'public_results';
            intentId = 'PUBLIC_RESULTS';
        }

        if (dataQuery) {
            try {
                const dataResponse = await this.chatDataService.handlePublicQuery(dataQuery);
                return {
                    intentId: intentId,
                    confidence: 1.0,
                    actionType: 'STATIC_RESPONSE',
                    response: dataResponse || "No public data found.",
                    processingTimeMs: 0
                };
            } catch (error) {
                console.error('[PublicDataEngine] Error:', error);
                return {
                    intentId: 'DB_ERROR',
                    confidence: 1.0,
                    actionType: 'STATIC_RESPONSE',
                    response: "I couldn't retrieve the public data right now."
                };
            }
        }

        return null;
    }

    matchesCategory(text, category) {
        return this.intentMap[category].some(keyword => text.includes(keyword));
    }

    getEngineName() { return 'PublicDataEngine'; }
    async isReady() { return true; }
}

module.exports = PublicDataEngine;
