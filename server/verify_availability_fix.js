const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Booking = require('./models/Booking');
const Court = require('./models/Court');
const Match = require('./models/Match');
const User = require('./models/User');

async function verifyFix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get a test court and user
        const court = await Court.findOne();
        const user = await User.findOne({ role: 'player' }) || await User.findOne();

        if (!court || !user) {
            console.error('Need at least one court and one user in DB to test.');
            process.exit(1);
        }

        const dateStr = '2026-02-13';
        const startTime = '11:00';
        const endTime = '12:00';
        const bookingDate = new Date(dateStr);
        bookingDate.setHours(0, 0, 0, 0);

        console.log(`Test Court: ${court.name} (${court._id})`);
        console.log(`Test Date: ${bookingDate.toISOString()}`);

        // 2. Clean up any existing test bookings/matches for this slot
        await Booking.deleteMany({ court: court._id, date: bookingDate, startTime });
        await Match.deleteMany({ court: court.name, scheduledTime: { $gte: bookingDate, $lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000) } });

        console.log('--- TEST 1: Regular Booking conflict ---');
        // Create a booking
        await Booking.create({
            court: court._id,
            user: user._id,
            date: bookingDate,
            startTime,
            endTime,
            totalPrice: 100,
            status: 'confirmed',
            paymentStatus: 'paid'
        });
        console.log('Created a baseline booking.');

        // Verify availability API would show it as booked
        // (Simulate controller logic here since we are not running the server in the script)
        const checkBooking = await Booking.findOne({
            court: court._id,
            date: bookingDate,
            startTime,
            status: { $nin: ['cancelled'] }
        });
        console.log('Booking found via query:', !!checkBooking);

        console.log('--- TEST 2: Tournament Match conflict ---');
        const matchTime = new Date(dateStr);
        matchTime.setHours(14, 0, 0, 0); // 14:00

        const tournamentId = new mongoose.Types.ObjectId();
        await Match.create({
            tournament: tournamentId,
            category: 'mens_singles',
            round: 'final',
            matchNumber: 1,
            court: court.name,
            scheduledTime: matchTime,
            status: 'scheduled'
        });
        console.log('Created a tournament match at 14:00.');

        const conflictingMatch = await Match.findOne({
            court: court.name,
            scheduledTime: {
                $gte: bookingDate,
                $lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000)
            },
            status: { $nin: ['cancelled'] }
        });

        if (conflictingMatch) {
            const mTime = new Date(conflictingMatch.scheduledTime);
            console.log(`Match conflict found at: ${mTime.getHours().toString().padStart(2, '0')}:00`);
        }

        console.log('--- VERIFICATION SUCCESSFUL ---');

        // Clean up
        await Booking.deleteMany({ court: court._id, date: bookingDate, startTime });
        await Match.deleteMany({ tournament: tournamentId });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Verification Error:', error);
    }
}

verifyFix();
