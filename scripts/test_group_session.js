const mongoose = require('mongoose');
const path = require('path');

console.log('--- STARTING TEST SCRIPT ---');

try {
    console.log('Loading User model...');
    const User = require('../server/models/User');
    console.log('Loading Session model...');
    const Session = require('../server/models/Session');
    console.log('Loading Court model...');
    const Court = require('../server/models/Court');
    console.log('Loading CoachProfile model...');
    const CoachProfile = require('../server/models/CoachProfile');
    console.log('All models loaded successfully.');

    async function run() {
        try {
            await mongoose.connect('mongodb://localhost:27017/sportsphere');
            console.log('DB Connected');

            const coach = await User.findOne({ name: /jahagrir/i, role: 'coach' });
            if (!coach) {
                console.log('Coach Jahagrir not found. Creating him...');
                // Creating a coach if not found
                const newCoach = await User.create({
                    name: 'Jahagrir',
                    email: 'jahagrir@test.com',
                    password: 'password123',
                    role: 'coach',
                    city: 'Test City'
                });
                console.log(`Created Coach: ${newCoach.name}`);
                await CoachProfile.create({
                    user: newCoach._id,
                    specialization: ['singles'],
                    experience: 5,
                    hourlyRate: 500,
                    bio: 'Elite Coach',
                    availability: []
                });
            }

            const coachId = (await User.findOne({ name: /jahagrir/i, role: 'coach' }))._id;
            const court = await Court.findOne();
            if (!court) {
                console.log('No courts found. Creating a test court...');
                await Court.create({
                    name: 'Center Court',
                    location: { university: 'Sports Univ', city: 'Karachi' },
                    type: 'hard',
                    pricePerHour: 1000,
                    isVerified: true
                });
            }
            const activeCourt = await Court.findOne();

            const players = await User.find({ role: 'player' }).limit(5);
            if (players.length < 5) {
                for (let i = players.length; i < 5; i++) {
                    await User.create({
                        name: `Player ${i + 1}`,
                        email: `player${i + 1}@test.com`,
                        password: 'password123',
                        role: 'player'
                    });
                }
            }
            const activePlayers = await User.find({ role: 'player' }).limit(5);
            const playerIds = activePlayers.map(p => p._id);

            const session = await Session.create({
                coach: coachId,
                students: playerIds,
                court: activeCourt._id,
                date: new Date(),
                startTime: '10:00',
                endTime: '11:00',
                duration: 1,
                totalPrice: 1000,
                courtFee: activeCourt.pricePerHour,
                maxStudents: 5,
                courtPaymentStatus: 'paid',
                status: 'confirmed',
                isPublished: true
            });

            console.log('Success! Session created with 5 students and paid court fee.');
            console.log('Session ID:', session._id);
            process.exit(0);
        } catch (err) {
            console.error('Error during execution:', err);
            process.exit(1);
        }
    }

    run();
} catch (err) {
    console.error('Failed to load models:', err);
    process.exit(1);
}
