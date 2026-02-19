const axios = require('axios');
const API_URL = 'http://localhost:5000/api/auth';

const checkUser = async (email, password) => {
    try {
        console.log(`Logging in as ${email}...`);
        const loginRes = await axios.post(`${API_URL}/login`, { email, password });
        const token = loginRes.data.token;
        console.log('Login successful. Token received.');
        console.log('User from Login Response:', loginRes.data.user);

        console.log('Fetching /me endpoint...');
        const meRes = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('User from /me Response:', meRes.data.data);

        if (meRes.data.data.verified === true) {
            console.log('SUCCESS: Backend is reporting Verified: true');
        } else {
            console.log('FAILURE: Backend is reporting Verified: false');
        }

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
};

// Check for the admin user identified earlier
// Try common passwords
const runChecks = async () => {
    // Known coach from script
    await checkUser('coach.alex@example.com', 'securepassword123');

    // Admin attempts
    await checkUser('admin@test.com', 'admin123');
    await checkUser('admin@test.com', '123456');
    await checkUser('admin@sportsphere.pk', 'admin123');
};

runChecks();
