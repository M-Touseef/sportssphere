const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const verifyFlow = async () => {
    try {
        // 1. Login as Coach
        console.log('Logging in as Coach...');
        const coachLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'coach.alex@example.com',
            password: 'securepassword123'
        });
        const coachToken = coachLogin.data.token;
        const coachId = coachLogin.data.user.id;
        console.log('Coach logged in.');

        // 2. Get a Court
        console.log('Fetching courts...');
        const courts = await axios.get(`${BASE_URL}/courts`);
        const courtId = courts.data.data[0]._id;
        console.log('Using court:', courtId);

        // 3. Publish Session
        console.log('Publishing session...');
        const publishRes = await axios.post(`${BASE_URL}/sessions/publish`, {
            courtId,
            date: new Date().toISOString(),
            startTime: '16:00',
            endTime: '17:00',
            duration: 1,
            planType: 'hourly',
            notes: 'Tactical session'
        }, { headers: { Authorization: `Bearer ${coachToken}` } });
        const sessionId = publishRes.data.data._id;
        console.log('Session published:', sessionId);

        // 4. Login as Player
        console.log('Logging in as Player...');
        const playerLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'player.jordan@example.com',
            password: 'secureplayer123'
        });
        const playerToken = playerLogin.data.token;
        console.log('Player logged in.');

        // 5. Player Requests Session
        console.log('Requesting session...');
        const requestRes = await axios.post(`${BASE_URL}/sessions/${sessionId}/request`, {}, {
            headers: { Authorization: `Bearer ${playerToken}` }
        });
        console.log('Request sent status:', requestRes.data.data.status);

        // 6. Coach Confirms
        console.log('Confirming session...');
        const confirmRes = await axios.put(`${BASE_URL}/sessions/${sessionId}/confirm`, {}, {
            headers: { Authorization: `Bearer ${coachToken}` }
        });
        console.log('Session confirmed. Status:', confirmRes.data.data.status);

        console.log('\nVerification Successful! Coach-Centric model is live.');

    } catch (error) {
        console.error('Verification Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
};

verifyFlow();
