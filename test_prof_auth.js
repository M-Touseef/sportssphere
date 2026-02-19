const API_URL = 'http://localhost:5000/api/auth';
const PROF_URL = 'http://localhost:5000/api/professional';

const testProfUser = {
    name: 'Prof Tester',
    email: 'tester_prof_' + Date.now() + '@example.com',
    password: 'password123',
    role: 'player',
    skillLevel: 'professional',
    city: 'Lahore',
    rank: 'National #10'
};

async function runTests() {
    console.log('--- Starting Professional Auth Verification ---');

    try {
        // 1. Register a Professional
        console.log('\n1. Registering Professional User...');
        const regRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testProfUser)
        });
        const regData = await regRes.json();
        console.log('Registration Status:', regRes.status);
        console.log('Skill Level in response:', regData.user.skillLevel);

        // 2. Login to get Token
        console.log('\n2. Logging in...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testProfUser.email,
                password: testProfUser.password
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Token Received:', !!token);

        // 3. Test access to Professional Route
        // We expect 403 "Account pending verification" because skillLevel should now be recognized
        // If skillLevel were still missing, we would get "Access restricted to Professionals or Coaches"
        console.log('\n3. Testing Professional Route Access (expecting pending verification)...');
        const profRes = await fetch(`${PROF_URL}/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const profData = await profRes.json();
        console.log('Response Status:', profRes.status);
        console.log('Error Message:', profData.error);

        if (profData.error === 'Forbidden: Account pending verification') {
            console.log('\nSUCCESS: skillLevel is correctly recognized and included in JWT!');
        } else if (profData.error === 'Forbidden: Access restricted to Professionals or Coaches') {
            console.error('\nFAIL: skillLevel is still missing or not recognized in JWT.');
        } else {
            console.log('\nUnexpected response:', profData);
        }

    } catch (error) {
        console.error('\nTests Failed:', error.message);
        process.exit(1);
    }
}

runTests();
