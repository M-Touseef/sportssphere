/**
 * QueryRouter - Classifies user messages into high-level intent categories
 * 
 * Determines whether a query is likely "Personal", "Public Data", "Denied", or "Knowledge".
 */
class QueryRouter {
    constructor() {
        this.INTENT_TYPE_PERSONAL = 'PERSONAL';
        this.INTENT_TYPE_PUBLIC_DATA = 'PUBLIC_DATA';
        this.INTENT_TYPE_KNOWLEDGE = 'KNOWLEDGE';
        this.INTENT_TYPE_DENIED = 'DENIED';

        // Patterns that strongly suggest a personal query
        this.personalPatterns = [
            /my\s+(\w+\s+)?(schedule|match|game|booking|reservation|tournament|result|stat|profile)/i, // Matches "my match", "my next match", "my upcoming match"
            /when\s+is\s+my/i,
            /upcoming\s+(match|game|session)/i,
            /next\s+(match|game|session)/i, // Explicit "next match"
            /booked\s+court/i,
            /am\s+i\s+registered/i,
            /did\s+i\s+win/i,
            /who\s+am\s+i\s+playing/i
        ];

        // Patterns that suggest an attempt to access other user's data (TR-02)
        this.deniedPatterns = [
            /show\s+(details|schedule|profile|bookings)\s+of\s+(another|other)\s+(player|user)/i,
            /what\s+is\s+the\s+schedule\s+of\s+player\s+\w+/i,
            /which\s+tournaments\s+is\s+player\s+\w+\s+registered/i,
            /other\s+player/i,
            /user\s+\w+/i, // "User X"
            /player\s+\w+/i // "Player Y"
        ];

        // Patterns for public data
        this.publicPatterns = [
            /tournament\s+(score|standing|result)/i,
            /who\s+won/i,
            /match\s+result/i, // General match result
            /current\s+tournament/i,
            /ongoing\s+tournament/i
        ];
    }

    /**
     * Route user message to an intent type
     * @param {string} message - User's message
     * @returns {string} - INTENT_TYPE
     */
    route(message) {
        if (!message) return this.INTENT_TYPE_KNOWLEDGE;

        const normalized = message.toLowerCase();

        // 1. Check for Denied Patterns FIRST (Security TR-02)
        const isPersonal = this.personalPatterns.some(p => p.test(normalized));
        const isDenied = this.deniedPatterns.some(p => p.test(normalized));
        const isPublic = this.publicPatterns.some(p => p.test(normalized));

        // If it looks like "My match against Player X", it is PERSONAL (valid).
        // If it looks like "Show Player X's stats", it is DENIED.
        // The denied patterns are quite aggressive.
        // We prioritize Personal if "my" is present.

        if (isPersonal) {
            return this.INTENT_TYPE_PERSONAL;
        }

        if (isDenied) {
            return this.INTENT_TYPE_DENIED;
        }

        if (isPublic) {
            return this.INTENT_TYPE_PUBLIC_DATA;
        }

        // Default to Knowledge/General
        return this.INTENT_TYPE_KNOWLEDGE;
    }
}

module.exports = QueryRouter;
