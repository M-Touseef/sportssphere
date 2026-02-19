const API_URL = 'http://localhost:5000/api';
let token = '';
let courtId = '';
let bookingId = '';

const runTests = async () => {
    console.log('🚀 Starting Court Booking System Tests...\n');

    // Login first to get token
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com', // Assuming this user exists from previous tests
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();

        if (loginRes.status === 200 && loginData.token) {
            token = loginData.token;
            console.log('✅ Login Successful');
        } else {
            // Try to register if login fails
            console.log('⚠️ Login Failed, trying to register...');
            const regRes = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Booking Test User',
                    email: `booking${Date.now()}@example.com`,
                    password: 'password123',
                    role: 'organizer', // Try to register as organizer to create courts
                    city: 'Karachi'
                })
            });
            const regData = await regRes.json();

            if (regRes.status === 201 && regData.token) {
                token = regData.token;
                console.log('✅ Registration Successful (as Organizer)');
            } else {
                console.log('❌ Registration Failed:', regData);
                return;
            }
        }
    } catch (error) {
        console.log('❌ Auth Error:', error.message);
        return;
    }

    // 1. Create Court
    try {
        console.log('\n1. Creating Court...');
        const courtRes = await fetch(`${API_URL}/courts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Smash Arena ' + Date.now(),
                location: {
                    address: '123 Sports Complex',
                    city: 'Karachi'
                },
                description: 'Professional wooden court',
                pricePerHour: 1500,
                surfaceType: 'wooden',
                openingTime: '06:00',
                closingTime: '22:00',
                amenities: ['Parking', 'AC']
            })
        });
        const courtData = await courtRes.json();

        if (courtRes.status === 201) {
            courtId = courtData.data._id;
            console.log('✅ Court Created:', courtId);
        } else {
            console.log('⚠️ Court Creation Failed:', courtData.error);
            // Try to fetch existing courts
            const courtsRes = await fetch(`${API_URL}/courts`);
            const courtsData = await courtsRes.json();
            if (courtsData.data && courtsData.data.length > 0) {
                courtId = courtsData.data[0]._id;
                console.log('ℹ️ Using existing court:', courtId);
            } else {
                console.log('❌ No courts available');
                return;
            }
        }
    } catch (error) {
        console.log('❌ Court Error:', error.message);
        return;
    }

    // 2. Get Court Details
    try {
        console.log('\n2. Fetching Court Details...');
        const courtRes = await fetch(`${API_URL}/courts/${courtId}`);
        const courtData = await courtRes.json();
        if (courtData.success) {
            console.log('✅ Court Details Fetched');
        }
    } catch (error) {
        console.log('❌ Fetch Court Details Failed:', error.message);
    }

    // 3. Check Availability
    try {
        console.log('\n3. Checking Availability...');
        const date = new Date().toISOString().split('T')[0];
        const availRes = await fetch(`${API_URL}/courts/${courtId}/availability?date=${date}`);
        const availData = await availRes.json();
        if (availData.success) {
            console.log(`✅ Availability Checked (${availData.data.length} slots)`);
        }
    } catch (error) {
        console.log('❌ Check Availability Failed:', error.message);
    }

    // 4. Create Booking
    try {
        console.log('\n4. Creating Booking...');
        const date = new Date().toISOString().split('T')[0];
        const bookingRes = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                courtId,
                date,
                startTime: '10:00',
                endTime: '11:00'
            })
        });
        const bookingData = await bookingRes.json();

        if (bookingRes.status === 201) {
            bookingId = bookingData.data._id;
            console.log('✅ Booking Created:', bookingId);
        } else {
            console.log('❌ Booking Creation Failed:', bookingData.error);
        }
    } catch (error) {
        console.log('❌ Booking Creation Error:', error.message);
    }

    // 5. Get My Bookings
    try {
        console.log('\n5. Fetching My Bookings...');
        const myBookingsRes = await fetch(`${API_URL}/bookings/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const myBookingsData = await myBookingsRes.json();

        if (myBookingsData.data && myBookingsData.data.some(b => b._id === bookingId)) {
            console.log('✅ Booking found in list');
        } else {
            console.log('⚠️ Booking not found in list');
        }
    } catch (error) {
        console.log('❌ Fetch My Bookings Failed:', error.message);
    }

    // 6. Cancel Booking
    if (bookingId) {
        try {
            console.log('\n6. Cancelling Booking...');
            const cancelRes = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const cancelData = await cancelRes.json();

            if (cancelData.data && cancelData.data.status === 'cancelled') {
                console.log('✅ Booking Cancelled');
            } else {
                console.log('❌ Cancel Booking Failed:', cancelData);
            }
        } catch (error) {
            console.log('❌ Cancel Booking Error:', error.message);
        }
    }

    console.log('\n✨ Court Booking Tests Completed');
};

runTests();
