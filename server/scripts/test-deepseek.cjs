require('dotenv').config();

const DeepSeekEngine = require('../chatbot/engines/DeepSeekEngine');

const prompt = process.argv.slice(2).join(' ').trim() ||
    'Give me three concise tips to improve my badminton smash.';

async function main() {
    const engine = new DeepSeekEngine();
    const status = engine.getStatus();

    console.log(`DeepSeek configured: ${status.configured ? 'yes' : 'no'}`);
    console.log(`DeepSeek model: ${status.model}`);

    if (!status.configured) {
        console.error('DEEPSEEK_API_KEY is not configured in this environment.');
        process.exit(1);
    }

    const startedAt = Date.now();
    const result = await engine.resolveIntent(prompt);
    const elapsedMs = Date.now() - startedAt;

    if (!result) {
        console.error(`DeepSeek request failed after ${elapsedMs}ms. Check the provider error above.`);
        process.exit(1);
    }

    console.log(`DeepSeek source: ${result.source}`);
    console.log(`DeepSeek latency: ${elapsedMs}ms`);
    console.log(`DeepSeek response: ${result.response}`);
}

main().catch((error) => {
    console.error('DeepSeek smoke test failed:', error.message);
    process.exit(1);
});
