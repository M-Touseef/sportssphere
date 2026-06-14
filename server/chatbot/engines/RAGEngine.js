const IIntentResolver = require('../interfaces/IIntentResolver');

/** @gradio/client is ESM-only — load via dynamic import from CommonJS */
let gradioClientPromise = null;
const loadGradioClient = () => {
    if (!gradioClientPromise) {
        gradioClientPromise = import('@gradio/client');
    }
    return gradioClientPromise;
};

const CONNECTION_TIMEOUT_MS = Number(process.env.RAG_CONNECTION_TIMEOUT_MS) || 4000;
const RESPONSE_TIMEOUT_MS = Number(process.env.RAG_RESPONSE_TIMEOUT_MS) || 8000;

const withTimeout = (promise, timeoutMs, message) => {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
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
        this.connectionPromise = null;
    }

    /**
     * Initialize Gradio client
     */
    async initClient() {
        if (this.ready && this.client) return this.client;
        if (this.connectionPromise) return this.connectionPromise;

        this.connectionPromise = this.connectClient();

        try {
            return await this.connectionPromise;
        } catch (error) {
            console.error('[RAGEngine] Failed to initialize Gradio client:', error.message);
            this.ready = false;
            this.client = null;
            return null;
        } finally {
            this.connectionPromise = null;
        }
    }

    async connectClient() {
        const { Client } = await loadGradioClient();
        const client = await withTimeout(
            Client.connect(this.spaceId),
            CONNECTION_TIMEOUT_MS,
            'Hugging Face connection timed out'
        );

        this.client = client;
        this.ready = true;
        console.log(`[RAGEngine] Connected to Hugging Face Space: ${this.spaceId}`);
        return client;
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
            const result = await withTimeout(
                this.client.predict('/chatbot', { query: message }),
                RESPONSE_TIMEOUT_MS,
                'Hugging Face response timed out'
            );

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
