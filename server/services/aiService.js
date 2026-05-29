const axios = require('axios');
const RuleBasedEngine = require('../chatbot/engines/RuleBasedEngine');
const PersonalDataEngine = require('../chatbot/engines/PersonalDataEngine');
const PublicDataEngine = require('../chatbot/engines/PublicDataEngine');
const QueryRouter = require('../chatbot/QueryRouter');
const ResponseGenerator = require('../chatbot/ResponseGenerator');
const RAGEngine = require('../chatbot/engines/RAGEngine');

/** Rule intents that should not block database routing */
const RULE_ONLY_INTENTS = new Set(['GREETING', 'PLATFORM_INFO']);

/**
 * AIService - Hybrid chatbot orchestrator
 *
 * 1. Rules — greetings & platform intro
 * 2. Database — personal + public SportSphere data (MongoDB)
 * 3. RAG — badminton knowledge via Hugging Face Space (linked service)
 */
class AIService {
    constructor() {
        this.flaskUrl = process.env.AI_SERVICE_URL || process.env.FLASK_AI_URL || 'http://localhost:5001';

        this.ruleEngine = new RuleBasedEngine();
        this.ragEngine = new RAGEngine();
        this.personalEngine = new PersonalDataEngine();
        this.publicEngine = new PublicDataEngine();
        this.queryRouter = new QueryRouter();
        this.responseGenerator = new ResponseGenerator();
    }

    async ensureRAGEngine() {
        const maxAttempts = 150;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (this.ragEngine && (await this.ragEngine.isReady())) {
                return this.ragEngine;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return this.ragEngine;
    }

    /**
     * @returns {Promise<{ response: string, source: 'rules'|'database'|'rag' }>}
     */
    async generateResponse(message, context = {}) {
        try {
            const ruleResult = await this.ruleEngine.resolveIntent(message, context);
            if (
                ruleResult &&
                ruleResult.confidence > 0.8 &&
                RULE_ONLY_INTENTS.has(ruleResult.intentId)
            ) {
                const generated = await this.responseGenerator.generate(ruleResult, context);
                return {
                    response: generated.data.response,
                    source: 'rules'
                };
            }

            const intentType = this.queryRouter.route(message);

            if (intentType === this.queryRouter.INTENT_TYPE_DENIED) {
                return {
                    response: 'You can only access your own account information on SportSphere.',
                    source: 'rules'
                };
            }

            let result = null;
            let source = 'rag';

            if (intentType === this.queryRouter.INTENT_TYPE_PERSONAL) {
                result = await this.personalEngine.resolveIntent(message, context);
                source = result?.source || 'database';
            } else if (intentType === this.queryRouter.INTENT_TYPE_PUBLIC_DATA) {
                result = await this.publicEngine.resolveIntent(message, context);
                if (result) {
                    source = result.source || 'database';
                } else {
                    result = await this.resolveRAG(message, context);
                    source = 'rag';
                }
            } else {
                result = await this.resolveRAG(message, context);
                source = 'rag';
            }

            if (result && (result.intentId === 'RAG_QUERY' || result.intentId === 'RAG_FALLBACK')) {
                return {
                    response: result.response || this.getDefaultFallback(),
                    source: 'rag'
                };
            }

            if (result?.response) {
                const generated = await this.responseGenerator.generate(result, context);
                return {
                    response: generated.data.response || result.response,
                    source: result.source || source
                };
            }

            return {
                response: this.getDefaultFallback(),
                source: 'rag'
            };
        } catch (error) {
            console.error('[AIService] Error:', error.message);
            return {
                response: this.getDefaultFallback(),
                source: 'rag'
            };
        }
    }

    async resolveRAG(message, context) {
        const ragEngine = await this.ensureRAGEngine();
        if (ragEngine) {
            const result = await ragEngine.resolveIntent(message, context);
            if (result) {
                result.source = 'rag';
            }
            return result;
        }
        return {
            intentId: 'RAG_FALLBACK',
            actionType: 'STATIC_RESPONSE',
            response: this.getDefaultFallback(),
            source: 'rag'
        };
    }

    getDefaultFallback() {
        return 'I can answer badminton questions (rules, technique, equipment) or look up SportSphere data (your bookings, courts, coaches, tournaments). What would you like to know?';
    }

    async healthCheck() {
        try {
            const response = await axios.get(`${this.flaskUrl}/api/health`, { timeout: 3000 });
            return response.data.status === 'AI Service is running';
        } catch {
            return false;
        }
    }

    getRegisteredIntents() {
        return this.ruleEngine.getRegisteredIntents();
    }
}

module.exports = new AIService();
