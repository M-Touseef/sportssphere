const API_URL = 'http://localhost:5000/api/auth';
const USER_API_URL = 'http://localhost:5000/api/users';

const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'player',
    city: 'Karachi',
    skillLevel: 'intermediate'
};

let token = '';
let userId = '';

const runTests = async () => {
    console.log('🚀 Starting Auth System Tests...\n');

    try {
        // 1. Test Registration
        console.log('1. Testing Registration...');
        const regRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        console.log(`Status: ${regRes.status} ${regRes.statusText}`);
        const text = await regRes.text();
        try {
            const regData = JSON.parse(text);
            if (regRes.status === 201 && regData.token) {
                console.log('✅ Registration Successful');
                token = regData.token;
                userId = regData.user.id;
            } else {
                console.log('❌ Registration Failed', regData);
            }
        } catch (e) {
            console.log('❌ Registration Failed (Invalid JSON):', text.substring(0, 100));
        }
    } catch (error) {
        console.log('❌ Registration Error:', error.message);
    }

    if (!token) {
        console.log('Skipping remaining tests due to registration failure.');
        return;
    }

    try {
        // 2. Test Login
        console.log('\n2. Testing Login...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        const loginData = await loginRes.json();

        if (loginRes.status === 200 && loginData.token) {
            console.log('✅ Login Successful');
            token = loginData.token;
        } else {
            console.log('❌ Login Failed', loginData);
        }
    } catch (error) {
        console.log('❌ Login Error:', error.message);
    }

    try {
        // 3. Test Get Current User (Protected Route)
        console.log('\n3. Testing Get Current User (Protected)...');
        const meRes = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const meData = await meRes.json();

        if (meRes.status === 200 && meData.data.email === testUser.email) {
            console.log('✅ Get Current User Successful');
        } else {
            console.log('❌ Get Current User Failed', meData);
        }
    } catch (error) {
        console.log('❌ Get Current User Error:', error.message);
    }

    try {
        // 4. Test Update Profile
        console.log('\n4. Testing Update Profile...');
        const updateRes = await fetch(`${API_URL}/updatedetails`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                city: 'Lahore',
                phone: '03001234567'
            })
        });
        const updateData = await updateRes.json();

        if (updateRes.status === 200 && updateData.data.city === 'Lahore') {
            console.log('✅ Update Profile Successful');
        } else {
            console.log('❌ Update Profile Failed', updateData);
        }
    } catch (error) {
        console.log('❌ Update Profile Error:', error.message);
    }

    try {
        // 5. Test Public Profile Access
        console.log('\n5. Testing Public Profile Access...');
        const profileRes = await fetch(`${USER_API_URL}/profile/${userId}`);
        const profileData = await profileRes.json();

        if (profileRes.status === 200 && profileData.data.name === testUser.name) {
            console.log('✅ Public Profile Access Successful');
        } else {
            console.log('❌ Public Profile Access Failed', profileData);
        }
    } catch (error) {
        console.log('❌ Public Profile Access Error:', error.message);
    }

    console.log('\n✨ All Tests Completed');
};

runTests();
