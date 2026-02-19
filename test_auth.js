const API_URL = 'http://localhost:5000/api/auth';
const testUser = {
    name: 'Auth Tester',
    email: 'tester_auth_' + Date.now() + '@example.com',
    password: 'password123',
    role: 'player',
    skillLevel: 'non-professional',
    city: 'Islamabad'
};

async function runTests() {
    console.log('--- Starting Authentication Tests ---');

    try {
        // 1. Test Registration
        console.log('\n1. Testing Registration...');
        const regRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const regData = await regRes.json();
        console.log('Registration Status:', regRes.status);
        console.log('Success:', regData.success);
        if (!regData.success) {
            console.error('Registration error:', regData.error);
            throw new Error('Registration failed');
        }

        // 2. Test Login (Valid)
        console.log('\n2. Testing Login (Valid Credentials)...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        console.log('Token Received:', !!loginData.token);
        if (!loginData.token) {
            console.error('Login error:', loginData.error);
            throw new Error('Login failed (no token)');
        }

        // 3. Test Login (Invalid)
        console.log('\n3. Testing Login (Invalid Credentials)...');
        const invalidLoginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: 'wrong_password'
            })
        });
        const invalidLoginData = await invalidLoginRes.json();
        console.log('Expected Error Status (401):', invalidLoginRes.status);
        console.log('Error Message:', invalidLoginData.error);
        if (invalidLoginRes.status !== 401) {
            throw new Error('Login with wrong password should have returned 401');
        }

        // 4. Test Secure Access (Verify Token)
        console.log('\n4. Testing Secure Access (/me endpoint)...');
        const meRes = await fetch(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${loginData.token}` }
        });
        const meData = await meRes.json();
        console.log('GetMe Status:', meRes.status);
        console.log('User ID match:', meData.data._id === loginData.user.id);
        if (meRes.status !== 200 || meData.data._id !== loginData.user.id) {
            throw new Error('Secure access verification failed');
        }

        console.log('\n--- All Authentication Tests Passed Successfully! ---');
    } catch (error) {
        console.error('\nTests Failed:', error.message);
        process.exit(1);
    }
}

runTests();
