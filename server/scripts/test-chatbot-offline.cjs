/**
 * Offline chatbot tests (no HTTP / MongoDB required)
 * Run: node scripts/test-chatbot-offline.cjs
 */
const QueryRouter = require('../chatbot/QueryRouter');
const PersonalDataEngine = require('../chatbot/engines/PersonalDataEngine');
const PublicDataEngine = require('../chatbot/engines/PublicDataEngine');
const GeminiEngine = require('../chatbot/engines/GeminiEngine');
const aiService = require('../services/aiService');

let passed = 0;
let failed = 0;

function ok(name, condition, detail = '') {
    if (condition) {
        passed++;
        console.log(`[PASS] ${name}`);
    } else {
        failed++;
        console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
    }
}

async function main() {
    console.log('=== Chatbot offline scenario tests ===\n');
    const router = new QueryRouter();

    const routes = [
        ['What are my upcoming court bookings?', 'PERSONAL'],
        ['When is my next match?', 'PERSONAL'],
        ['Which tournaments am I registered for?', 'PERSONAL'],
        ['What are my coaching sessions?', 'PERSONAL'],
        ['What are my recent match results?', 'PERSONAL'],
        ['Show bookings of another user', 'DENIED'],
        ['Show another user bookings', 'DENIED'],
        ['List courts on SportSphere', 'PUBLIC_DATA'],
        ['Show coaches on SportSphere', 'PUBLIC_DATA'],
        ['List upcoming tournaments', 'PUBLIC_DATA'],
        ['Who won recent tournament matches?', 'PUBLIC_DATA'],
        ['Explain badminton scoring rules', 'KNOWLEDGE'],
        ['How can I improve my smash?', 'KNOWLEDGE'],
        ['Hello', 'KNOWLEDGE']
    ];

    for (const [q, expect] of routes) {
        const got = router.route(q);
        ok(`Route: ${q.slice(0, 40)}…`, got === router[`INTENT_TYPE_${expect}`], `got ${got}`);
    }

    ok('Public does not steal "my courts"', router.route('What are my court bookings?') === router.INTENT_TYPE_PERSONAL);

    const personal = new PersonalDataEngine();
    const userA = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    const userB = 'bbbbbbbbbbbbbbbbbbbbbbbb';

    personal.chatDataService = {
        handleUserQuery: async (userId, intent) => {
            if (userId !== userA) return "You don't have any upcoming court bookings.";
            if (intent === 'bookings') return 'You have 1 upcoming booking:\n\n1. Test Court Alpha';
            if (intent === 'results') return 'Your recent match results:\n\n1. Open Cup: Won';
            if (intent === 'sessions') return "You don't have any upcoming coaching sessions scheduled.";
            return `OK:${intent}`;
        }
    };

    const bookA = await personal.resolveIntent('What are my upcoming court bookings?', { userId: userA });
    const bookB = await personal.resolveIntent('What are my upcoming court bookings?', { userId: userB });
    ok('Personal A sees seeded booking', bookA.response.includes('Test Court Alpha'));
    ok('Personal B does not see A court', !bookB.response.includes('Test Court Alpha'));
    ok('Personal results not matches', (await personal.resolveIntent('What are my recent match results?', { userId: userA })).response.includes('recent match results'));

    const pub = new PublicDataEngine();
    pub.chatDataService = {
        extractCityHint: () => null,
        handlePublicQuery: async (intent) => {
            if (intent === 'public_courts') return 'Courts available on SportSphere:\n\n1. Hall One';
            if (intent === 'public_coaches') return 'Coaches on SportSphere:\n\n1. Coach Z';
            return `PUBLIC:${intent}`;
        }
    };
    const courts = await pub.resolveIntent('List courts on SportSphere', {});
    ok('Public courts from DB mock', courts.response.includes('Courts available on SportSphere'));

    pub.chatDataService.handlePublicQuery = async (intent) =>
        intent === 'public_results' ? 'Recent match results from various tournaments:' : `PUBLIC:${intent}`;
    const results = await pub.resolveIntent('Who won recent tournament matches?', {});
    ok('Public results not tournaments', results.intentId === 'PUBLIC_RESULTS');
    ok('Public results content', results.response.includes('Recent match results'));

    const denied = await aiService.generateResponse('Show another user bookings', { userId: userA });
    ok('AIService denies cross-user', /only access your own/i.test(denied.response));

    const originalRagEngine = aiService.ragEngine;
    const originalGeminiEngine = aiService.geminiEngine;
    let ragCalls = 0;
    aiService.ragEngine = {
        resolveIntent: async () => {
            ragCalls++;
            return { intentId: 'RAG_QUERY', response: 'RAG answer', source: 'rag' };
        }
    };
    aiService.geminiEngine = {
        isConfigured: () => true,
        resolveIntent: async () => ({
            intentId: 'GEMINI_QUERY',
            response: 'Gemini answer',
            source: 'gemini'
        })
    };
    const geminiPrimary = await aiService.generateResponse('How can I improve my smash?', {});
    ok('AIService uses Gemini as primary knowledge provider', geminiPrimary.source === 'gemini');
    ok('AIService skips RAG when Gemini succeeds', ragCalls === 0);

    aiService.geminiEngine.resolveIntent = async () => null;
    const ragFallback = await aiService.generateResponse('Explain badminton scoring rules', {});
    ok('AIService uses RAG when Gemini fails', ragFallback.source === 'rag');
    ok('AIService calls RAG after Gemini failure', ragCalls === 1);
    aiService.ragEngine = originalRagEngine;
    aiService.geminiEngine = originalGeminiEngine;

    const originalFetch = global.fetch;
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    const originalGeminiModel = process.env.GEMINI_MODEL;
    let geminiRequest = null;
    try {
        process.env.GEMINI_API_KEY = 'test-key';
        delete process.env.GEMINI_MODEL;
        global.fetch = async (url, options) => {
            geminiRequest = { url, options, body: JSON.parse(options.body) };
            return {
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: 'Keep your grip relaxed.' }] } }]
                })
            };
        };

        const geminiEngine = new GeminiEngine();
        const geminiResult = await geminiEngine.resolveIntent('How can I improve my smash?');
        ok('Gemini engine parses generated content', geminiResult?.response === 'Keep your grip relaxed.');
        ok('Gemini engine sends only the general question',
            geminiRequest?.body?.contents?.[0]?.parts?.[0]?.text === 'How can I improve my smash?');
        ok('Gemini engine uses API key header',
            geminiRequest?.options?.headers?.['x-goog-api-key'] === 'test-key');
        ok('Gemini engine uses supported default model',
            geminiRequest?.url?.includes('/models/gemini-3.1-flash-lite:generateContent'));
    } finally {
        global.fetch = originalFetch;
        if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalGeminiKey;
        if (originalGeminiModel === undefined) delete process.env.GEMINI_MODEL;
        else process.env.GEMINI_MODEL = originalGeminiModel;
    }

    console.log(`\n=== ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
}

main();
