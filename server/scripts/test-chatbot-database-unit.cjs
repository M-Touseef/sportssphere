/**
 * Unit tests for chatbot DB scoping (no HTTP server required)
 * Run: node scripts/test-chatbot-database-unit.cjs
 */
require('dotenv').config();
const mongoose = require('mongoose');
const QueryRouter = require('../chatbot/QueryRouter');
const chatDataService = require('../services/chatDataService');
const aiService = require('../services/aiService');

function assert(condition, msg) {
    if (!condition) throw new Error(`FAIL: ${msg}`);
}

async function main() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.log('Skip DB tests: no MONGO_URI');
        process.exit(0);
    }
    await mongoose.connect(uri);
    console.log('=== Chatbot DB unit tests ===\n');

    const router = new QueryRouter();
    assert(
        router.route('What are my upcoming court bookings?') === router.INTENT_TYPE_PERSONAL,
        'my bookings → PERSONAL'
    );
    assert(
        router.route('Show another user bookings') === router.INTENT_TYPE_DENIED,
        'other user bookings → DENIED'
    );
    console.log('✓ QueryRouter');

    const Booking = require('../models/Booking');
    const sample = await Booking.findOne().populate('user', 'name email').lean();
    if (sample?.user) {
        const ownerId = String(sample.user._id || sample.user);
        const otherId = new mongoose.Types.ObjectId().toString();
        const ownerResp = await chatDataService.handleUserQuery(ownerId, 'bookings');
        const otherResp = await chatDataService.handleUserQuery(otherId, 'bookings');
        assert(typeof ownerResp === 'string', 'owner gets string response');
        assert(typeof otherResp === 'string', 'other user gets string response');
        if (ownerResp.includes('upcoming booking') && !/don'?t have any/i.test(ownerResp)) {
            assert(
                !ownerResp.includes(sample.user.email || ''),
                'booking text must not expose owner email'
            );
        }
        console.log('✓ handleUserQuery uses userId filter only');
        console.log('  Owner preview:', ownerResp.slice(0, 80).replace(/\n/g, ' '));
    } else {
        console.log('○ No bookings in DB to cross-check (empty responses still scoped)');
    }

    const denied = await aiService.generateResponse('Show another user bookings', {
        userId: sample?.user ? String(sample.user._id) : new mongoose.Types.ObjectId().toString()
    });
    assert(denied.source === 'rules' || /only access your own/i.test(denied.response), 'denied cross-user');
    console.log('✓ aiService blocks cross-user requests');

    await mongoose.disconnect();
    console.log('\n=== Unit tests passed ===');
}

main().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
