const IIntentResolver = require('../interfaces/IIntentResolver');

const RESPONSE_TIMEOUT_MS = Number(process.env.RAG_RESPONSE_TIMEOUT_MS) || 8000;
const DEFAULT_SPACE_URL = 'https://sportssphere-chatbot.hf.space';

const parseGradioResult = (payload) => {
    const lines = payload.split(/\r?\n/);
    let eventName = '';

    for (const line of lines) {
        if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
            continue;
        }

        if (!line.startsWith('data:')) continue;
        if (eventName === 'error') throw new Error('Hugging Face inference failed');
        if (eventName !== 'complete') continue;

        const data = JSON.parse(line.slice(5).trim());
        const value = Array.isArray(data) ? data[0] : data;
        if (typeof value === 'string') return value;
        if (value?.response) return value.response;
        if (value?.answer) return value.answer;
        return JSON.stringify(value);
    }

    throw new Error('Hugging Face returned no completed response');
};

class RAGEngine extends IIntentResolver {
    constructor() {
        super();
        this.baseUrl = (process.env.RAG_SPACE_URL || DEFAULT_SPACE_URL).replace(/\/+$/, '');
        this.ready = true;
    }

    async request(message) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RESPONSE_TIMEOUT_MS);

        try {
            const startResponse = await fetch(`${this.baseUrl}/gradio_api/call/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [message] }),
                signal: controller.signal
            });

            if (!startResponse.ok) {
                throw new Error(`Hugging Face request failed with ${startResponse.status}`);
            }

            const { event_id: eventId } = await startResponse.json();
            if (!eventId) throw new Error('Hugging Face returned no event ID');

            const resultResponse = await fetch(
                `${this.baseUrl}/gradio_api/call/chat/${encodeURIComponent(eventId)}`,
                { signal: controller.signal }
            );

            if (!resultResponse.ok) {
                throw new Error(`Hugging Face result failed with ${resultResponse.status}`);
            }

            return parseGradioResult(await resultResponse.text());
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async resolveIntent(message) {
        try {
            const response = await this.request(message);
            return {
                intentId: 'RAG_QUERY',
                confidence: 0.9,
                actionType: 'STATIC_RESPONSE',
                response,
                source: 'rag',
                retrievedContext: 'Hugging Face RAG Service',
                processingTimeMs: 0
            };
        } catch (error) {
            console.error('[RAGEngine] Hugging Face error:', error.message);
            return {
                intentId: 'RAG_FALLBACK',
                confidence: 0.5,
                actionType: 'STATIC_RESPONSE',
                response: 'I can help with badminton rules, techniques, and equipment. Could you be more specific?',
                source: 'rag',
                retrievedContext: 'Fallback response',
                processingTimeMs: 0
            };
        }
    }

    getEngineName() { return 'RAGEngine'; }
    async isReady() { return this.ready; }
}

module.exports = RAGEngine;
