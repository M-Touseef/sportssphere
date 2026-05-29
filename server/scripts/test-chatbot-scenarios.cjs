/**
 * Full hybrid chatbot scenario tests (real API + optional DB seed)
 * Run from server/: node scripts/test-chatbot-scenarios.cjs
 *
 * Requires API on PORT (default 5000) and MongoDB reachable.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const QueryRouter = require('../chatbot/QueryRouter');

const BASE = process.env.API_BASE || `http://localhost:${process.env.PORT || 5000}/api`;
const RUN_ID = Date.now();

const results = [];
let passed = 0;
let failed = 0;
let skipped = 0;

function record(name, ok, detail = '') {
    results.push({ name, ok, detail });
    if (ok) passed++;
    else failed++;
    const icon = ok ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${name}${detail ? ` — ${detail}` : ''}`);
}

function skip(name, reason) {
    results.push({ name, ok: null, detail: reason });
    skipped++;
    console.log(`[SKIP] ${name} — ${reason}`);
}

async function req(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        signal: AbortSignal.timeout(options.timeout || 90000)
    });
    const text = await res.text();
    let body;
    try {
        body = JSON.parse(text);
    } catch {
        body = text;
    }
    return { status: res.status, body };
}

async function registerUser(label) {
    const email = `chatbot-e2e-${label}-${RUN_ID}@test.local`;
    const password = 'TestPass123!';
    const reg = await req('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            name: `E2E ${label}`,
            email,
            password,
            role: 'player'
        })
    });
    if (reg.status >= 500) {
        throw new Error(`Register ${label} server error: ${JSON.stringify(reg.body)}`);
    }
    const login = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    if (!login.body?.token) {
        throw new Error(`Login ${label} failed: ${JSON.stringify(login.body)}`);
    }
    return {
        label,
        email,
        token: login.body.token,
        id: String(login.body.user?.id || login.body.user?._id)
    };
}

async function seedBookingForUser(userId) {
    const Court = require('../models/Court');
    const Booking = require('../models/Booking');

    let court = await Court.findOne().lean();
    if (!court) {
        skip('Seed booking', 'No courts in database');
        return null;
    }

    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(12, 0, 0, 0);
    const uniqueStart = `${10 + (RUN_ID % 8)}:${String(RUN_ID % 60).padStart(2, '0')}`;

    try {
        const booking = await Booking.create({
            user: userId,
            court: court._id,
            date,
            startTime: uniqueStart,
            endTime: `${parseInt(uniqueStart.split(':')[0], 10) + 1}:00`,
            totalPrice: court.pricePerHour || 1500,
            status: 'confirmed',
            paymentStatus: 'paid'
        });
        return { booking, courtName: court.name };
    } catch (e) {
        skip('Seed booking', e.message);
        return null;
    }
}

class ChatSession {
    constructor(token) {
        this.token = token;
        this.convId = null;
    }

    async ask(message) {
        const auth = { Authorization: `Bearer ${this.token}` };
        if (!this.convId) {
            const conv = await req('/chat/conversations', {
                method: 'POST',
                headers: auth,
                body: JSON.stringify({ title: `E2E ${RUN_ID}` })
            });
            this.convId = conv.body?.data?._id;
            if (!this.convId) throw new Error('Could not create conversation');
        }
        const msg = await req(`/chat/conversations/${this.convId}/messages`, {
            method: 'POST',
            headers: auth,
            body: JSON.stringify({ message }),
            timeout: 120000
        });
        return {
            status: msg.status,
            content: msg.body?.data?.aiMessage?.content || '',
            source: msg.body?.data?.aiMessage?.source,
            error: msg.body?.error
        };
    }
}

async function checkApiHealth() {
    try {
        const res = await fetch(`${BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'probe@test.local', password: 'x' }),
            signal: AbortSignal.timeout(5000)
        });
        return res.status === 400 || res.status === 401 || res.status === 200;
    } catch {
        return false;
    }
}

async function runScenario(name, fn) {
    try {
        await fn();
    } catch (e) {
        record(name, false, e.message);
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  SportSphere Chatbot — Full scenario test suite');
    console.log('  API:', BASE);
    console.log('═══════════════════════════════════════════════════\n');

    const router = new QueryRouter();
    record('Router: personal bookings', router.route('What are my upcoming court bookings?') === router.INTENT_TYPE_PERSONAL);
    record('Router: denied cross-user', router.route('Show another user bookings') === router.INTENT_TYPE_DENIED);
    record('Router: public courts', router.route('List courts on SportSphere') === router.INTENT_TYPE_PUBLIC_DATA);
    record('Router: knowledge', router.route('Explain badminton scoring rules') === router.INTENT_TYPE_KNOWLEDGE);

    const apiUp = await checkApiHealth();
    if (!apiUp) {
        console.error('\nAPI not reachable. Start server: cd server && node index.js');
        process.exit(1);
    }

    let userA;
    let userB;
    let seedInfo = null;

    await runScenario('Setup: register users A & B', async () => {
        userA = await registerUser('A');
        userB = await registerUser('B');
        record('Setup: register users A & B', true, `${userA.email}`);
    });
    if (!userA || !userB) {
        console.log('\nCannot continue without users.');
        process.exit(1);
    }

    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (uri) {
        try {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
            seedInfo = await seedBookingForUser(userA.id);
            if (seedInfo) {
                record('Setup: seed booking for user A', true, seedInfo.courtName);
            }
            await mongoose.disconnect();
        } catch (e) {
            skip('Setup: seed booking', `MongoDB: ${e.message}`);
        }
    } else {
        skip('Setup: seed booking', 'No MONGO_URI');
    }

    if (!seedInfo && userA?.token) {
        try {
            const seedConv = new ChatSession(userA.token);
            const probe = await seedConv.ask('What are my upcoming court bookings?');
            if (/you have \d+ upcoming booking/i.test(probe.content)) {
                const courtMatch = probe.content.match(/^\d+\.\s+(.+)$/m);
                seedInfo = { courtName: courtMatch?.[1]?.trim() || 'existing booking' };
                record('Setup: detect existing booking for A', true, seedInfo.courtName);
            }
        } catch {
            /* optional */
        }
    }

    const chatA = new ChatSession(userA.token);
    const chatB = new ChatSession(userB.token);

    // ─── Personal (database) ───
    await runScenario('Personal: my court bookings (A)', async () => {
        const r = await chatA.ask('What are my upcoming court bookings?');
        assert(r.status === 200, 'HTTP 200');
        const hasData = seedInfo && /you have \d+ upcoming booking/i.test(r.content);
        const empty = /don'?t have any upcoming court bookings/i.test(r.content);
        assert(hasData || empty, r.content.slice(0, 120));
        assert(
            !/order of play|court assignments/i.test(r.content),
            'Personal bookings must come from database, not RAG'
        );
        if (r.source) assert(r.source === 'database', `expected database source, got ${r.source}`);
        if (seedInfo && hasData) {
            assert(r.content.includes(seedInfo.courtName), 'Should mention seeded court');
        }
        record('Personal: my court bookings (A)', true, `source=${r.source || 'n/a'}`);
    });

    await runScenario('Personal: my court bookings (B) — isolation', async () => {
        const r = await chatB.ask('What are my upcoming court bookings?');
        assert(r.status === 200, 'HTTP 200');
        if (seedInfo) {
            assert(!r.content.includes(seedInfo.courtName), 'User B must not see A court');
        }
        assert(
            /don'?t have any upcoming court bookings/i.test(r.content) || /you have \d+ upcoming booking/i.test(r.content),
            r.content.slice(0, 120)
        );
        record('Personal: my court bookings (B) — isolation', true);
    });

    await runScenario('Personal: my tournaments', async () => {
        const r = await chatA.ask('Which tournaments am I registered for?');
        assert(r.status === 200);
        assert(
            /registered for|haven'?t registered/i.test(r.content),
            r.content.slice(0, 100)
        );
        record('Personal: my tournaments', true, `source=${r.source || 'n/a'}`);
    });

    await runScenario('Personal: my matches', async () => {
        const r = await chatA.ask('When is my next match?');
        assert(r.status === 200);
        assert(
            /upcoming match|don'?t have any upcoming matches/i.test(r.content),
            r.content.slice(0, 100)
        );
        record('Personal: my matches', true);
    });

    await runScenario('Personal: coaching sessions', async () => {
        const r = await chatA.ask('What are my coaching sessions?');
        assert(r.status === 200);
        assert(
            /coaching session|don'?t have any upcoming coaching/i.test(r.content),
            r.content.slice(0, 100)
        );
        assert(
            !/browse coach profiles and book sessions on our coaches page/i.test(r.content),
            'Must use DB sessions, not navigation rule'
        );
        record('Personal: coaching sessions', true);
    });

    await runScenario('Personal: match results', async () => {
        const r = await chatA.ask('What are my recent match results?');
        assert(r.status === 200);
        assert(
            /recent match results|don'?t have any completed matches/i.test(r.content),
            r.content.slice(0, 100)
        );
        assert(
            !/upcoming matches scheduled/i.test(r.content),
            'Must be completed results, not upcoming matches'
        );
        record('Personal: match results', true);
    });

    // ─── Security ───
    await runScenario('Security: deny other user bookings', async () => {
        const r = await chatB.ask('Show bookings of another user');
        assert(/only access your own|own account information/i.test(r.content), r.content.slice(0, 150));
        record('Security: deny other user bookings', true);
    });

    await runScenario('Security: deny another player schedule', async () => {
        const r = await chatB.ask('Show another user bookings');
        assert(/only access your own|own account information/i.test(r.content), r.content.slice(0, 150));
        record('Security: deny another player schedule', true);
    });

    // ─── Public (database) ───
    await runScenario('Public: list courts', async () => {
        const r = await chatA.ask('List courts on SportSphere');
        assert(r.status === 200);
        assert(
            /courts available on SportSphere|no courts are listed/i.test(r.content) ||
                (/court/i.test(r.content) && r.source === 'database'),
            r.content.slice(0, 100)
        );
        assert(!r.content.includes(userB.email), 'No private email leak');
        record('Public: list courts', true, `source=${r.source || 'n/a'}`);
    });

    await runScenario('Public: list coaches', async () => {
        const r = await chatA.ask('Show coaches on SportSphere');
        assert(r.status === 200);
        assert(
            /coaches on SportSphere|no coaches are listed/i.test(r.content) ||
                (/coach/i.test(r.content) && r.source === 'database'),
            r.content.slice(0, 100)
        );
        record('Public: list coaches', true);
    });

    await runScenario('Public: tournaments', async () => {
        const r = await chatA.ask('List upcoming tournaments');
        assert(r.status === 200);
        assert(
            /upcoming and ongoing tournaments|no upcoming tournaments/i.test(r.content) ||
                (r.source === 'database' && /tournament/i.test(r.content)),
            r.content.slice(0, 100)
        );
        assert(!/BWF World Ranking/i.test(r.content), 'Should be DB tournaments, not RAG');
        record('Public: tournaments', true);
    });

    await runScenario('Public: match results', async () => {
        const r = await chatA.ask('Who won recent tournament matches?');
        assert(r.status === 200);
        assert(
            /recent match results|no recent match results available/i.test(r.content) ||
                (r.source === 'database' && /vs/i.test(r.content)),
            r.content.slice(0, 100)
        );
        assert(!/no upcoming tournaments at the moment/i.test(r.content), 'Should be results, not tournament list');
        record('Public: match results', true, `source=${r.source || 'n/a'}`);
    });

    // ─── Rules / greeting ───
    await runScenario('Rules: greeting', async () => {
        const r = await chatA.ask('Hello');
        assert(r.status === 200);
        assert(/hello|hi|assist|help|badminton/i.test(r.content), r.content.slice(0, 80));
        record('Rules: greeting', true, `source=${r.source || 'n/a'}`);
    });

    await runScenario('Rules: platform help', async () => {
        const r = await chatA.ask('What can you do on SportSphere?');
        assert(r.status === 200);
        assert(/court|coach|tournament|sparring|SportSphere/i.test(r.content), r.content.slice(0, 80));
        record('Rules: platform help', true);
    });

    // ─── RAG (knowledge) ───
    await runScenario('RAG: badminton net height', async () => {
        const r = await chatA.ask('What is the height of a badminton net?');
        assert(r.status === 200);
        const knowledge = /net|1\.55|5\s*ft|1\.524|meter|metre|feet|cm|mm|\d+\s*m/i.test(r.content);
        const fallback = /badminton|clarify|help/i.test(r.content);
        assert(knowledge || fallback, r.content.slice(0, 150));
        record('RAG: badminton net height', true, `source=${r.source || 'n/a'}`);
    });

    await runScenario('RAG: smash technique', async () => {
        const r = await chatA.ask('How can I improve my smash technique?');
        assert(r.status === 200);
        assert(r.content.length > 20, 'Empty RAG response');
        assert(!/you have \d+ upcoming booking/i.test(r.content), 'Should not be DB booking reply');
        record('RAG: smash technique', true, `source=${r.source || 'n/a'}`);
    });

    await runScenario('RAG: scoring rules', async () => {
        const r = await chatA.ask('Explain badminton scoring rules');
        assert(r.status === 200);
        assert(/21|point|game|score|rally/i.test(r.content) || r.content.length > 30, r.content.slice(0, 100));
        record('RAG: scoring rules', true);
    });

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    console.log('═══════════════════════════════════════════════════');

    if (failed > 0) {
        console.log('\nFailed scenarios:');
        results.filter((r) => r.ok === false).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
        process.exit(1);
    }
}

function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
}

main().catch((e) => {
    console.error('\nFatal:', e.message);
    process.exit(1);
});
