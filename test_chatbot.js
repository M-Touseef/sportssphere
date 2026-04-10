// Test script for the chatbot system
const aiService = require('./server/services/aiService');

async function testChatbot() {
    console.log('🧪 Testing SportSphere Chatbot System...\n');

    const testQueries = [
        {
            query: 'What are badminton rules?',
            context: { userSkillLevel: 'beginner', userCity: 'Karachi' },
            type: 'Knowledge Query (RAG)'
        },
        {
            query: 'When is my next match?',
            context: { userId: 'test_user_id' },
            type: 'Personal Query'
        },
        {
            query: 'Hello',
            context: {},
            type: 'Greeting (Rule-based)'
        }
    ];

    for (const test of testQueries) {
        console.log(`\n📝 Testing: ${test.type}`);
        console.log(`❓ Query: "${test.query}"`);
        
        try {
            const startTime = Date.now();
            const response = await aiService.generateResponse(test.query, test.context);
            const endTime = Date.now();
            
            console.log(`✅ Response: "${response}"`);
            console.log(`⏱️  Response Time: ${endTime - startTime}ms`);
            console.log('---');
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            console.log('---');
        }
    }

    console.log('\n🎯 Test Summary:');
    console.log('- RAG Engine: Hugging Face Space (currently failing with 405)');
    console.log('- Fallback: Working (basic responses)');
    console.log('- Personal Data: Should work with user context');
    console.log('- Rule-based: Should work for greetings');
}

testChatbot().catch(console.error);
