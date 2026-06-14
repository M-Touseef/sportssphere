const IIntentResolver = require('../interfaces/IIntentResolver');

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const DEFAULT_TIMEOUT_MS = 10000;

class GeminiEngine extends IIntentResolver {
    constructor() {
        super();
        this.apiKey = (process.env.GEMINI_API_KEY || '').trim();
        this.baseUrl = (process.env.GEMINI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
        this.model = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
        this.timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    }

    isConfigured() {
        return Boolean(this.apiKey);
    }

    getStatus() {
        return { configured: this.isConfigured(), model: this.model };
    }

    async resolveIntent(message) {
        if (!this.isConfigured()) return null;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(
                `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent`,
                {
                    method: 'POST',
                    headers: {
                        'x-goog-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        system_instruction: {
                            parts: [{
                                text: [
                                    'You are the SportsSphere badminton assistant.',
                                    'Answer only badminton rules, technique, training, equipment, fitness, and strategy questions.',
                                    'Do not invent live SportsSphere account, booking, court, coach, tournament, or payment data.',
                                    'Keep answers practical, concise, and safe.'
                                ].join(' ')
                            }]
                        },
                        contents: [{ role: 'user', parts: [{ text: message }] }],
                        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
                    }),
                    signal: controller.signal
                }
            );

            if (!response.ok) {
                const body = await response.text();
                throw new Error(`Gemini request failed with ${response.status}: ${body.slice(0, 160)}`);
            }

            const payload = await response.json();
            const answer = payload.candidates?.[0]?.content?.parts
                ?.map(part => part.text || '')
                .join('')
                .trim();
            if (!answer) throw new Error('Gemini returned an empty response');

            return {
                intentId: 'GEMINI_QUERY',
                confidence: 0.8,
                actionType: 'STATIC_RESPONSE',
                response: answer,
                source: 'gemini',
                processingTimeMs: 0
            };
        } catch (error) {
            const reason = error.name === 'AbortError' ? 'request timed out' : error.message;
            console.error('[GeminiEngine] Error:', reason);
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    getEngineName() { return 'GeminiEngine'; }
    async isReady() { return this.isConfigured(); }
}

module.exports = GeminiEngine;
