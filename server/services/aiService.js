const axios = require('axios');
const RuleBasedEngine = require('../chatbot/engines/RuleBasedEngine');
const MLEngine = require('../chatbot/engines/MLEngine'); // Keeping for legacy reference or removal
const PersonalDataEngine = require('../chatbot/engines/PersonalDataEngine');
const PublicDataEngine = require('../chatbot/engines/PublicDataEngine'); // NEW
const QueryRouter = require('../chatbot/QueryRouter');
const ResponseGenerator = require('../chatbot/ResponseGenerator');

/**
 * AIService - Orchestrates intent resolution using RAG and Personal Data Routing
 */
class AIService {
    constructor() {
        this.flaskUrl = process.env.AI_SERVICE_URL || process.env.FLASK_AI_URL || 'http://localhost:5001';
        this.useFlaskFallback = true; // Use Flask for RAG generation

        // Initialize engines
        this.ruleEngine = new RuleBasedEngine();
        this.ragEngine = null; // Will be initialized asynchronously
        this.personalEngine = new PersonalDataEngine();
        this.publicEngine = new PublicDataEngine(); // NEW
        this.queryRouter = new QueryRouter();
        this.responseGenerator = new ResponseGenerator();

        // Initialize RAGEngine dynamically (ESM module)
        this.initRAGEngine();
    }

    /**
     * Initialize RAGEngine dynamically (ESM module)
     */
    async initRAGEngine() {
        try {
            const { default: RAGEngine } = await import('../chatbot/engines/RAGEngine.mjs');
            this.ragEngine = new RAGEngine();
        } catch (error) {
            console.error('[AIService] Failed to initialize RAGEngine:', error.message);
            this.ragEngine = null;
        }
    }

    /**
     * Ensure RAGEngine is ready before using
     */
    async ensureRAGEngine() {
        // Wait up to 5 seconds for initialization
        let attempts = 0;
        while (!this.ragEngine && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        return this.ragEngine;
    }

    /**
     * Main method to generate response using the new architecture
     * @param {string} message - User's message
     * @param {Object} context - Context (userId, skillLevel, etc.)
     * @returns {Promise<string>} - Response text for the chat
     */
    async generateResponse(message, context = {}) {
        try {
            // Step 1: Check RuleBasedEngine for high-priority shortcuts (Greetings, Navigation)
            const ruleResult = await this.ruleEngine.resolveIntent(message, context);
            if (ruleResult && ruleResult.confidence > 0.8) {
                const response = await this.responseGenerator.generate(ruleResult, context);
                return response.data.response;
            }

            // Step 2: Route the query
            const intentType = this.queryRouter.route(message);

            if (intentType === this.queryRouter.INTENT_TYPE_DENIED) {
                return "You can only access your own account information."; // TR-02 Compliance
            }

            let result = null;

            // Step 3: Dispatch to appropriate engine
            if (intentType === this.queryRouter.INTENT_TYPE_PERSONAL) {
                result = await this.personalEngine.resolveIntent(message, context);
            } else if (intentType === this.queryRouter.INTENT_TYPE_PUBLIC_DATA) {
                result = await this.publicEngine.resolveIntent(message, context);
            } else {
                // KNOWLEDGE -> RAG
                const ragEngine = await this.ensureRAGEngine();
                if (ragEngine) {
                    result = await ragEngine.resolveIntent(message, context);
                } else {
                    // Fallback if RAGEngine not available
                    return this.getDefaultFallback();
                }
            }

            // Step 4: Handle RAG Response (Direct from Hugging Face)
            if (result && result.intentId === 'RAG_QUERY') {
                return result.response || this.getDefaultFallback();
            }

            // Step 5: Normal Generation
            const response = await this.responseGenerator.generate(result, context);
            return response.data.response || this.getDefaultFallback();

        } catch (error) {
            console.error('[AIService] Error:', error.message);
            return this.getDefaultFallback();
        }
    }

    /**
     * Call Flask AI service with RAG Prompt
     */
    async callFlaskServiceWithContext(prompt, context) {
        try {
            // We send the augmented prompt as the "message" to the Flask service
            // The Flask service treats it as a standard LLM query
            const response = await axios.post(`${this.flaskUrl}/api/send_message`, {
                message: prompt,
                context
            }, {
                timeout: 8000 // Slightly longer timeout for generation
            });

            if (response.data && response.data.response) {
                return response.data.response;
            }
        } catch (error) {
            console.error('[AIService] Flask RAG error:', error.message);
            if (error.code === 'ECONNREFUSED') {
                console.error(`[AIService] Could not connect to Flask at ${this.flaskUrl}. Is the AI service running?`);
            }
            return "I have the information but couldn't generate a response right now. Please try again.";
        }
        return this.getDefaultFallback();
    }

    // Legacy method for direct fallback if needed
    async callFlaskService(message, context) {
        return this.callFlaskServiceWithContext(message, context);
    }

    getDefaultFallback() {
        return "I can help you with badminton rules, techniques, and specific bookings. Could you clarify your request?";
    }

    async healthCheck() {
        try {
            const response = await axios.get(`${this.flaskUrl}/api/health`, { timeout: 3000 });
            return response.data.status === 'AI Service is running';
        } catch (error) {
            return false;
        }
    }

    getRegisteredIntents() {
        return this.ruleEngine.getRegisteredIntents();
    }
}

module.exports = new AIService();
