const API_URL = 'http://localhost:5000/api';
let coachToken = '';
let playerToken = '';
let coachId = '';
let sessionId = '';

const runTests = async () => {
    console.log('Starting Coach Session Confirmation Tests...\n');

    // 1. Create/Login Coach
    try {
        console.log('1. Setting up Coach...');
        const uniqueSuffix = Date.now();
        const coachEmail = `coach${uniqueSuffix}@example.com`;

        // Register Coach
        const regCoachRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Coach',
                email: coachEmail,
                password: 'password123',
                role: 'coach',
                city: 'Karachi'
            })
        });
        const regCoachData = await regCoachRes.json();
        coachToken = regCoachData.token;
        coachId = regCoachData.data.user._id;

        // Create Coach Profile
        await fetch(`${API_URL}/coaches/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${coachToken}`
            },
            body: JSON.stringify({
                specialization: ['singles'],
                experience: 5,
                hourlyRate: 1000,
                bio: 'Great coach',
                availability: [{ day: 'monday', startTime: '09:00', endTime: '18:00' }],
                location: { city: 'Karachi', areas: ['DHA'] }
            })
        });
        console.log('Coach Registered and Profile Created');
    } catch (error) {
        console.log('Coach Setup Failed:', error.message);
        return;
    }

    // 2. Create/Login Player
    try {
        console.log('\n2. Setting up Player...');
        const playerEmail = `player${Date.now()}@example.com`;
        const regPlayerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Player',
                email: playerEmail,
                password: 'password123',
                role: 'player',
                city: 'Karachi'
            })
        });
        const regPlayerData = await regPlayerRes.json();
        playerToken = regPlayerData.token;
        console.log('Player Registered');
    } catch (error) {
        console.log('Player Setup Failed:', error.message);
        return;
    }

    // 3. Player Books Session
    try {
        console.log('\n3. Player Booking Session...');
        const date = new Date();
        date.setDate(date.getDate() + 1); // Tomorrow

        const bookingRes = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${playerToken}`
            },
            body: JSON.stringify({
                coachId: coachId,
                date: date.toISOString().split('T')[0],
                startTime: '10:00',
                endTime: '11:00',
                duration: 1,
                location: 'DHA Sports Club',
                sessionType: 'individual',
                notes: 'Test session'
            })
        });
        const bookingData = await bookingRes.json();

        if (bookingData.success) {
            sessionId = bookingData.data._id;
            console.log('Session Booked. Status:', bookingData.data.status);
            if (bookingData.data.status !== 'pending') {
                console.log('Expected status to be pending, got:', bookingData.data.status);
            }
        } else {
            console.log('Booking Failed:', bookingData);
            return;
        }
    } catch (error) {
        console.log('Booking Error:', error.message);
        return;
    }

    // 4. Coach Confirms Session
    try {
        console.log('\n4. Coach Confirming Session...');
        const confirmRes = await fetch(`${API_URL}/sessions/${sessionId}/confirm`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${coachToken}`
            }
        });
        const confirmData = await confirmRes.json();

        if (confirmData.success) {
            console.log('Session Confirmed. Status:', confirmData.data.status);
            if (confirmData.data.status !== 'confirmed') {
                console.log('Expected status to be confirmed, got:', confirmData.data.status);
            }
        } else {
            console.log('Confirmation Failed:', confirmData);
        }
    } catch (error) {
        console.log('Confirmation Error:', error.message);
    }

    // 5. Test Rejection Flow (Bonus)
    try {
        console.log('\n5. Testing Rejection Flow...');
        // Create another booking
        const date = new Date();
        date.setDate(date.getDate() + 2); // Day after tomorrow

        const bookingRes = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${playerToken}`
            },
            body: JSON.stringify({
                coachId: coachId,
                date: date.toISOString().split('T')[0],
                startTime: '12:00',
                endTime: '13:00',
                duration: 1,
                location: 'DHA Sports Club',
                sessionType: 'individual'
            })
        });
        const bookingData = await bookingRes.json();
        const rejectSessionId = bookingData.data._id;

        // Reject it
        const rejectRes = await fetch(`${API_URL}/sessions/${rejectSessionId}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${coachToken}` }
        });
        const rejectData = await rejectRes.json();

        if (rejectData.success && rejectData.data.status === 'cancelled') {
            console.log('Session Rejected successfully');
        } else {
            console.log('Rejection Failed:', rejectData);
        }

    } catch (error) {
        console.log('Rejection Flow Error:', error.message);
    }

    console.log('\nCoach Session Test Completed');
};

runTests();
