#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const GeminiEngine = require('../chatbot/engines/GeminiEngine');

async function main() {
    const engine = new GeminiEngine();
    const status = engine.getStatus();

    console.log(`Gemini configured: ${status.configured ? 'yes' : 'no'}`);
    console.log(`Gemini model: ${status.model}`);

    if (!status.configured) {
        console.error('GEMINI_API_KEY is not configured in this environment.');
        process.exit(1);
    }

    const startedAt = Date.now();
    const result = await engine.resolveIntent('In two sentences, explain badminton rally scoring.');
    const elapsedMs = Date.now() - startedAt;

    if (!result) {
        console.error(`Gemini request failed after ${elapsedMs}ms. Check the provider error above.`);
        process.exit(1);
    }

    console.log(`Gemini source: ${result.source}`);
    console.log(`Gemini latency: ${elapsedMs}ms`);
    console.log(`Gemini response: ${result.response}`);
}

main().catch((error) => {
    console.error('Gemini smoke test failed:', error.message);
    process.exit(1);
});
