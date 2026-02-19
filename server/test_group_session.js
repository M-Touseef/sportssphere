const mongoose = require('mongoose');

// Models
const User = require('./models/User');
const Session = require('./models/Session');
const Court = require('./models/Court');
const CoachProfile = require('./models/CoachProfile');

async function runTest() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect('mongodb://localhost:27017/sportsphere');
        console.log('Connected.');

        // 1. Get/Create Admin/Owner for Court
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            admin = await User.create({
                name: 'Admin User',
                email: `admin_${Date.now()}@test.com`,
                password: 'password123',
                role: 'admin'
            });
        }

        // 2. Find or Create Coach "Jahagrir"
        const coachName = 'Jahagrir';
        let coach = await User.findOne({ name: /jahagrir/i, role: 'coach' });
        if (!coach) {
            console.log(`Coach "${coachName}" not found. Creating...`);
            coach = await User.create({
                name: coachName,
                email: `jahagrir_${Date.now()}@test.com`,
                password: 'password123',
                role: 'coach',
                city: 'Karachi'
            });
        }
        console.log(`Using Coach: ${coach.name} (${coach._id})`);

        // 3. Ensure CoachProfile exists
        let profile = await CoachProfile.findOne({ user: coach._id });
        if (!profile) {
            console.log('Creating CoachProfile...');
            profile = await CoachProfile.create({
                user: coach._id,
                specialization: ['singles'],
                experience: 10,
                hourlyRate: 1500,
                bio: 'Elite badminton mentor.',
                location: { city: 'Karachi' }
            });
        }

        // 4. Find or Create a Court with ALL required fields
        let court = await Court.findOne();
        if (!court) {
            console.log('No courts found. Creating valid test court...');
            court = await Court.create({
                name: 'Elite Court 1',
                location: {
                    address: '123 Sports Avenue',
                    city: 'Karachi'
                },
                description: 'Full sized international standard court.',
                surfaceType: 'wooden',
                pricePerHour: 1200,
                openingTime: '06:00',
                closingTime: '22:00',
                owner: admin._id,
                isVerified: true
            });
        }
        console.log(`Using Court: ${court.name} (Rs. ${court.pricePerHour}/hr)`);

        // 5. Find or Create 5 Players
        let players = await User.find({ role: 'player' }).limit(5);
        if (players.length < 5) {
            console.log(`Only found ${players.length} players. Creating more...`);
            for (let i = players.length; i < 5; i++) {
                const p = await User.create({
                    name: `Group Student ${i + 1}`,
                    email: `student${i + 1}_${Date.now()}@test.com`,
                    password: 'password123',
                    role: 'player'
                });
                players.push(p);
            }
        }
        const studentIds = players.map(p => p._id);
        console.log(`Enrolling 5 students...`);

        // 6. Create Group Session with Court Booking (Status Paid)
        const duration = 2; // 2 hours
        const courtFee = court.pricePerHour * duration;

        const startTime = '18:00';
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 2); // 2 days from now

        // Cleanup any existing test session for this slot
        await Session.deleteMany({ coach: coach._id, date, startTime });

        const session = await Session.create({
            coach: coach._id,
            students: studentIds,
            court: court._id,
            date: date,
            startTime: startTime,
            endTime: '20:00',
            duration,
            totalPrice: profile.hourlyRate * duration,
            courtFee,
            maxStudents: 5,
            courtPaymentStatus: 'paid', // "Coach has booked the court"
            status: 'confirmed',
            isPublished: true,
            notes: 'Official Group Session for Jahagrir - Test Case'
        });

        console.log('\n--- SESSION TEST RESULTS ---');
        console.log(`Session ID: ${session._id}`);
        console.log(`Capacity: ${session.students.length}/${session.maxStudents}`);
        console.log(`Court Fee Status: ${session.courtPaymentStatus} (Rs. ${session.courtFee})`);
        console.log(`Session Status: ${session.status}`);
        console.log('--- TEST COMPLETED ---');

        process.exit(0);
    } catch (err) {
        console.error('Test Failed!');
        if (err.errors) {
            console.log('Validation Errors:');
            Object.keys(err.errors).forEach(key => {
                console.log(`- ${key}: ${err.errors[key].message}`);
            });
        } else {
            console.error(err);
        }
        process.exit(1);
    }
}

runTest();
