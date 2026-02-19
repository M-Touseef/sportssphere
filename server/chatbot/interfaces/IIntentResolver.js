/**
 * IIntentResolver - Interface for intent resolution engines
 * 
 * Both RuleBasedEngine and MLEngine MUST implement this interface
 * to ensure consistent behavior and easy swapping between engines.
 * 
 * @interface IIntentResolver
 */

/**
 * Intent result object returned by all resolvers
 * @typedef {Object} IntentResult
 * @property {string} intentId - Unique intent identifier (e.g., 'BOOK_COURT', 'FAQ_RULES')
 * @property {number} confidence - Confidence score between 0 and 1
 * @property {Object} entities - Extracted entities from the message
 * @property {string} actionType - Type of action to take (STATIC_RESPONSE, ROUTE_TO_SERVICE, FETCH_USER_DATA, FALLBACK)
 * @property {string|null} response - Pre-defined response text (for static responses)
 */

/**
 * Context object passed to resolvers
 * @typedef {Object} ResolverContext
 * @property {string} userId - User's ID for personalized queries
 * @property {string} userSkillLevel - User's skill level (beginner, intermediate, advanced)
 * @property {string} userCity - User's city
 * @property {string} lastTopic - Last discussed topic
 */

class IIntentResolver {
    /**
     * Resolve intent from user message
     * @param {string} message - User's input message
     * @param {ResolverContext} context - Context for personalized resolution
     * @returns {Promise<IntentResult|null>} - Intent result or null if no match
     */
    async resolveIntent(message, context) {
        throw new Error('IIntentResolver.resolveIntent() must be implemented by subclass');
    }

    /**
     * Get engine name for logging/debugging
     * @returns {string} - Engine name
     */
    getEngineName() {
        throw new Error('IIntentResolver.getEngineName() must be implemented by subclass');
    }

    /**
     * Check if engine is ready for use
     * @returns {Promise<boolean>} - True if ready
     */
    async isReady() {
        throw new Error('IIntentResolver.isReady() must be implemented by subclass');
    }
}

module.exports = IIntentResolver;
