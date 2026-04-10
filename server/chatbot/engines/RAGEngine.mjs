import IIntentResolver from '../interfaces/IIntentResolver.js';
import axios from 'axios';

/**
 * RAGEngine - Retrieval-Augmented Generation Engine using Hugging Face
 * 
 * Uses online Hugging Face RAG service via direct HTTP API.
 * Provides intelligent responses for badminton-related queries.
 */
class RAGEngine extends IIntentResolver {
    constructor() {
        super();
        this.baseUrl = 'https://sportssphere-chatbot.hf.space';
        this.ready = true; // Always ready, uses HTTP
        console.log('[RAGEngine] Initialized with HTTP API');
    }

    /**
     * Resolve intent using RAG with Hugging Face endpoint via HTTP
     * @param {string} message - User's input message
     * @param {Object} context - Context
     * @returns {Promise<Object>} - Intent result with RAG response
     */
    async resolveIntent(message, context = {}) {
        try {
            // Call the Hugging Face space API directly
            const response = await axios.post(`${this.baseUrl}/api/predict`, {
                query: message
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            const reply = response.data?.response || response.data?.[0] || "I'm not sure how to respond to that.";
            
            return {
                intentId: 'RAG_QUERY',
                confidence: 0.9,
                actionType: 'STATIC_RESPONSE',
                response: reply,
                retrievedContext: 'Hugging Face RAG Service',
                processingTimeMs: 0
            };
        } catch (error) {
            console.error('[RAGEngine] HTTP API error:', error.message);
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

export default RAGEngine;
