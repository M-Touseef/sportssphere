const chatDataService = require('../services/chatDataService');

/**
 * ResponseGenerator - Generates consistent responses from intent results
 * 
 * Takes intent result from any resolver (Rule or ML) and produces
 * a standardized JSON response format.
 */
class ResponseGenerator {
    constructor() {
        this.chatDataService = chatDataService;
    }

    /**
     * Generate response from intent result
     * @param {Object} intentResult - Result from intent resolver
     * @param {Object} context - User context (userId, etc.)
     * @returns {Promise<Object>} - Standardized response
     */
    async generate(intentResult, context = {}) {
        if (!intentResult) {
            return this.getFallbackResponse();
        }

        const { actionType, intentId } = intentResult;

        switch (actionType) {
            case 'STATIC_RESPONSE':
                return this.generateStaticResponse(intentResult);

            case 'FETCH_USER_DATA':
                return await this.generateUserDataResponse(intentResult, context);

            case 'ROUTE_TO_SERVICE':
                return this.generateServiceResponse(intentResult);

            case 'FALLBACK':
            default:
                return this.generateFallbackResponse(intentResult);
        }
    }

    /**
     * Generate static response (FAQ, greetings, etc.)
     * @param {Object} intentResult
     * @returns {Object}
     */
    generateStaticResponse(intentResult) {
        return {
            success: true,
            data: {
                intentId: intentResult.intentId,
                confidence: intentResult.confidence,
                response: intentResult.response,
                action: null,
                processingTimeMs: intentResult.processingTimeMs
            }
        };
    }

    /**
     * Generate response with user-specific data
     * @param {Object} intentResult
     * @param {Object} context
     * @returns {Promise<Object>}
     */
    async generateUserDataResponse(intentResult, context) {
        let response = intentResult.response || '';
        let userData = null;

        if (context.userId && intentResult.dataQuery) {
            try {
                const dataResponse = await this.chatDataService.handleUserQuery(
                    context.userId,
                    intentResult.dataQuery
                );

                if (dataResponse) {
                    response = dataResponse;
                    userData = { query: intentResult.dataQuery };
                }
            } catch (error) {
                console.error('[ResponseGenerator] Error fetching user data:', error);
                response = "I couldn't retrieve your data right now. Please try again later.";
            }
        }

        return {
            success: true,
            data: {
                intentId: intentResult.intentId,
                confidence: intentResult.confidence,
                response: response,
                action: {
                    type: 'USER_DATA',
                    userData: userData
                },
                processingTimeMs: intentResult.processingTimeMs
            }
        };
    }

    /**
     * Generate response with navigation action
     * @param {Object} intentResult
     * @returns {Object}
     */
    generateServiceResponse(intentResult) {
        return {
            success: true,
            data: {
                intentId: intentResult.intentId,
                confidence: intentResult.confidence,
                response: intentResult.response,
                action: {
                    type: 'NAVIGATE',
                    target: intentResult.serviceRoute || null
                },
                processingTimeMs: intentResult.processingTimeMs
            }
        };
    }

    /**
     * Generate fallback response
     * @param {Object} intentResult
     * @returns {Object}
     */
    generateFallbackResponse(intentResult) {
        return {
            success: true,
            data: {
                intentId: intentResult?.intentId || 'FALLBACK',
                confidence: intentResult?.confidence || 0,
                response: intentResult?.response || this.getDefaultFallbackMessage(),
                action: null,
                forwardToML: intentResult?.forwardToML || false,
                processingTimeMs: intentResult?.processingTimeMs || 0
            }
        };
    }

    /**
     * Get default fallback response when no intent result
     * @returns {Object}
     */
    getFallbackResponse() {
        return {
            success: true,
            data: {
                intentId: 'FALLBACK',
                confidence: 0,
                response: this.getDefaultFallbackMessage(),
                action: null,
                forwardToML: true,
                processingTimeMs: 0
            }
        };
    }

    /**
     * Default fallback message
     * @returns {string}
     */
    getDefaultFallbackMessage() {
        return "I'm not sure I understood that. I can help you with badminton rules, techniques, equipment, booking courts, finding coaches, or checking your matches and tournaments. Could you please rephrase?";
    }
}

module.exports = ResponseGenerator;
