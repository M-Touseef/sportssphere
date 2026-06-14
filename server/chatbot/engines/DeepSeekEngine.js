const IIntentResolver = require('../interfaces/IIntentResolver');

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-chat';
const DEFAULT_TIMEOUT_MS = 10000;
const MODEL_ALIASES = {
    'deepseek-v4-flash': DEFAULT_MODEL
};

class DeepSeekEngine extends IIntentResolver {
    constructor() {
        super();
        this.apiKey = (process.env.DEEPSEEK_API_KEY || '').trim();
        this.baseUrl = (process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
        const configuredModel = (process.env.DEEPSEEK_MODEL || DEFAULT_MODEL).trim();
        this.model = MODEL_ALIASES[configuredModel] || configuredModel;
        this.timeoutMs = Number(process.env.DEEPSEEK_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    }

    isConfigured() {
        return Boolean(this.apiKey);
    }

    getStatus() {
        return {
            configured: this.isConfigured(),
            model: this.model
        };
    }

    async resolveIntent(message) {
        if (!this.isConfigured()) return null;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: [
                                'You are the SportsSphere badminton assistant.',
                                'Answer only badminton rules, technique, training, equipment, fitness, and strategy questions.',
                                'Do not invent live SportsSphere account, booking, court, coach, tournament, or payment data.',
                                'Keep answers practical, concise, and safe.'
                            ].join(' ')
                        },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.3,
                    max_tokens: 500,
                    stream: false
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(`DeepSeek request failed with ${response.status}: ${body.slice(0, 160)}`);
            }

            const payload = await response.json();
            const answer = payload.choices?.[0]?.message?.content?.trim();
            if (!answer) throw new Error('DeepSeek returned an empty response');

            return {
                intentId: 'DEEPSEEK_QUERY',
                confidence: 0.8,
                actionType: 'STATIC_RESPONSE',
                response: answer,
                source: 'deepseek',
                processingTimeMs: 0
            };
        } catch (error) {
            const reason = error.name === 'AbortError' ? 'request timed out' : error.message;
            console.error('[DeepSeekEngine] Error:', reason);
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    getEngineName() { return 'DeepSeekEngine'; }
    async isReady() { return this.isConfigured(); }
}

module.exports = DeepSeekEngine;
