const axios = require('axios');
const RuleBasedEngine = require('../chatbot/engines/RuleBasedEngine');
const PersonalDataEngine = require('../chatbot/engines/PersonalDataEngine');
const PublicDataEngine = require('../chatbot/engines/PublicDataEngine');
const QueryRouter = require('../chatbot/QueryRouter');
const ResponseGenerator = require('../chatbot/ResponseGenerator');
const RAGEngine = require('../chatbot/engines/RAGEngine');
const DeepSeekEngine = require('../chatbot/engines/DeepSeekEngine');

/** Rule intents that should not block database routing */
const RULE_ONLY_INTENTS = new Set(['GREETING', 'PLATFORM_INFO']);
const AI_RESPONSE_TIMEOUT_MS = Number(process.env.AI_RESPONSE_TIMEOUT_MS) || 10000;

const withTimeout = (promise, timeoutMs) => {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('AI response timed out')), timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

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
        this.deepSeekEngine = new DeepSeekEngine();
        this.personalEngine = new PersonalDataEngine();
        this.publicEngine = new PublicDataEngine();
        this.queryRouter = new QueryRouter();
        this.responseGenerator = new ResponseGenerator();
    }

    /**
     * @returns {Promise<{ response: string, source: 'rules'|'database'|'rag'|'deepseek' }>}
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

            if (result && (result.intentId === 'RAG_QUERY' || result.intentId === 'DEEPSEEK_QUERY')) {
                return {
                    response: result.response || this.getDefaultFallback(),
                    source: result.source || 'rag'
                };
            }

            if (result?.intentId === 'RAG_FALLBACK') {
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
        if (this.ragEngine) {
            const result = await withTimeout(
                this.ragEngine.resolveIntent(message, context),
                AI_RESPONSE_TIMEOUT_MS
            ).catch((error) => {
                console.warn('[AIService] RAG fallback:', error.message);
                return null;
            });

            if (result?.intentId === 'RAG_QUERY') {
                result.source = 'rag';
                return result;
            }
        }

        if (this.deepSeekEngine?.isConfigured()) {
            const deepSeekResult = await withTimeout(
                this.deepSeekEngine.resolveIntent(message),
                AI_RESPONSE_TIMEOUT_MS
            ).catch((error) => {
                console.warn('[AIService] DeepSeek fallback:', error.message);
                return null;
            });

            if (deepSeekResult) return deepSeekResult;
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

    getProviderStatus() {
        return {
            rag: { configured: Boolean(this.ragEngine) },
            deepseek: this.deepSeekEngine?.getStatus() || { configured: false, model: null }
        };
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
