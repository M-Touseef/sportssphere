const IIntentResolver = require('../interfaces/IIntentResolver');

/** @gradio/client is ESM-only — load via dynamic import from CommonJS */
let gradioClientPromise = null;
const loadGradioClient = () => {
    if (!gradioClientPromise) {
        gradioClientPromise = import('@gradio/client');
    }
    return gradioClientPromise;
};

/**
 * RAGEngine - Retrieval-Augmented Generation Engine using Hugging Face
 *
 * Uses online Hugging Face RAG service instead of local knowledge base.
 * Provides intelligent responses for badminton-related queries.
 */
class RAGEngine extends IIntentResolver {
    constructor() {
        super();
        this.client = null;
        this.ready = false;
        // Hugging Face Space: https://huggingface.co/spaces/Sportssphere/chatbot
        this.spaceId =
            process.env.RAG_SPACE_ID ||
            process.env.HF_CHATBOT_SPACE ||
            'Sportssphere/chatbot';
        this.initClient();
    }

    /**
     * Initialize Gradio client
     */
    async initClient() {
        try {
            const { Client } = await loadGradioClient();
            this.client = await Client.connect(this.spaceId);
            this.ready = true;
            console.log(`[RAGEngine] Connected to Hugging Face Space: ${this.spaceId}`);
        } catch (error) {
            console.error('[RAGEngine] Failed to initialize Gradio client:', error.message);
            this.ready = false;
        }
    }

    /**
     * Resolve intent using RAG with Hugging Face endpoint
     * @param {string} message - User's input message
     * @param {Object} context - Context
     * @returns {Promise<Object>} - Intent result with RAG response
     */
    async resolveIntent(message, context = {}) {
        try {
            // Ensure client is initialized
            if (!this.ready) {
                await this.initClient();
            }

            if (!this.client) {
                throw new Error('Gradio client not available');
            }

            // Call the /chatbot endpoint with query parameter
            const result = await this.client.predict("/chatbot", {
                query: message
            });

            // Extract response from result.data
            const response = result.data && result.data.length > 0 ? result.data[0] : "I'm not sure how to respond to that.";
            
            return {
                intentId: 'RAG_QUERY',
                confidence: 0.9,
                actionType: 'STATIC_RESPONSE',
                response: response,
                source: 'rag',
                retrievedContext: 'Hugging Face RAG Service',
                processingTimeMs: 0
            };
        } catch (error) {
            console.error('[RAGEngine] Hugging Face error:', error.message);
            // Fallback to basic response
            return {
                intentId: 'RAG_FALLBACK',
                confidence: 0.5,
                actionType: 'STATIC_RESPONSE',
                response: "I can help with badminton rules, techniques, and equipment. Could you be more specific?",
                retrievedContext: 'Fallback response',
                processingTimeMs: 0
            };
        }
    }

    getEngineName() { return 'RAGEngine'; }
    async isReady() { return this.ready; }
}

module.exports = RAGEngine;
