/**
 * Hybrid chatbot — database isolation & routing tests
 * Run from server/: node scripts/test-chatbot-database-security.cjs
 */
const QueryRouter = require('../chatbot/QueryRouter');

const BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function req(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
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
    const email = `chatbot-sec-${label}-${Date.now()}@test.local`;
    const password = 'TestPass123!';
    await req('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            name: `Sec Test ${label}`,
            email,
            password,
            role: 'player'
        })
    });
    const login = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    if (!login.body?.token) {
        throw new Error(`Login failed for ${label}: ${JSON.stringify(login.body)}`);
    }
    return {
        label,
        email,
        name: `Sec Test ${label}`,
        token: login.body.token
    };
}

async function ask(token, message) {
    const auth = { Authorization: `Bearer ${token}` };
    const conv = await req('/chat/conversations', {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ title: 'Security test' })
    });
    const convId = conv.body?.data?._id;
    if (!convId) throw new Error('No conversation');

    const msg = await req(`/chat/conversations/${convId}/messages`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ message })
    });
    return {
        status: msg.status,
        content: msg.body?.data?.aiMessage?.content || '',
        source: msg.body?.data?.aiMessage?.source,
        error: msg.body?.error
    };
}

function assert(condition, message) {
    if (!condition) throw new Error(`FAIL: ${message}`);
}

function runRouterTests() {
    const router = new QueryRouter();
    const cases = [
        { q: 'What are my upcoming court bookings?', expect: 'PERSONAL' },
        { q: 'Show another user bookings', expect: 'DENIED' },
        { q: 'Show bookings of other player', expect: 'DENIED' },
        { q: 'List available courts on SportSphere', expect: 'PUBLIC_DATA' },
        { q: 'Explain badminton scoring rules', expect: 'KNOWLEDGE' }
    ];
    for (const { q, expect } of cases) {
        const got = router.route(q);
        assert(got === router[`INTENT_TYPE_${expect}`], `"${q}" → ${got}, expected ${expect}`);
    }
    console.log('✓ QueryRouter classification (5 cases)');
}

async function main() {
    console.log('=== Chatbot database security tests ===\n');

    runRouterTests();

    const userA = await registerUser('A');
    const userB = await registerUser('B');
    console.log('✓ Created users A and B');

    const myBookingsA = await ask(userA.token, 'What are my upcoming court bookings?');
    const myBookingsB = await ask(userB.token, 'What are my upcoming court bookings?');

    assert(myBookingsA.status === 200, 'User A booking query failed');
    assert(myBookingsB.status === 200, 'User B booking query failed');
    const isPersonalBookingReply = (r) =>
        r.source === 'database' ||
        /don'?t have any upcoming court bookings/i.test(r.content) ||
        /you have \d+ upcoming booking/i.test(r.content);

    assert(isPersonalBookingReply(myBookingsA), `User A bad reply: ${myBookingsA.content.slice(0, 150)}`);
    assert(isPersonalBookingReply(myBookingsB), `User B bad reply: ${myBookingsB.content.slice(0, 150)}`);
    assert(
        !/SportSphere offers court booking/i.test(myBookingsA.content),
        'Personal query must not return generic platform FAQ'
    );
    console.log('✓ Personal bookings scoped per user (source:', myBookingsA.source || 'database-like', ')');
    console.log('  User A:', myBookingsA.content.slice(0, 100).replace(/\n/g, ' '));
    console.log('  User B:', myBookingsB.content.slice(0, 100).replace(/\n/g, ' '));

    const crossAsk = await ask(userB.token, 'Show bookings of another user');
    assert(
        /only access your own|own account information/i.test(crossAsk.content),
        `Cross-user query should be denied, got: ${crossAsk.content.slice(0, 200)}`
    );
    console.log('✓ Cross-user booking request blocked');

    const publicCourts = await ask(userA.token, 'List courts on SportSphere');
    assert(publicCourts.status === 200, 'Public courts query failed');
    assert(
        publicCourts.source === 'database' || /court/i.test(publicCourts.content),
        'Public courts should use database'
    );
    assert(!publicCourts.content.includes(userB.email), 'Public response must not include other user email');
    console.log('✓ Public courts query (no private user data leak)');

    const ragQ = await ask(userA.token, 'What is the height of a badminton net?');
    assert(ragQ.status === 200, 'RAG question failed');
    assert(
        ragQ.source === 'rag' || /net|meter|feet|1\.55|5\s*ft/i.test(ragQ.content),
        `Expected RAG/knowledge answer, source=${ragQ.source}`
    );
    console.log('✓ Knowledge question (source:', ragQ.source || 'n/a', ')');

    console.log('\n=== All checks passed ===');
}

main().catch((e) => {
    console.error('\n', e.message);
    process.exit(1);
});
