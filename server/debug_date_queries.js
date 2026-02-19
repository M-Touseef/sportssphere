const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Booking = require('./models/Booking');

async function checkDateQueries() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dateStr = '2026-01-13';
        const startTime = '10:00';

        // Exact date like createBooking
        const bookingDate = new Date(dateStr);
        bookingDate.setHours(0, 0, 0, 0);
        console.log('Search date (exact):', bookingDate.toISOString());

        // Range like getAvailability
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);
        console.log('Search range:', startOfDay.toISOString(), 'to', endOfDay.toISOString());

        const bookings = await Booking.find({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        console.log(`Found ${bookings.length} bookings in range:`);
        bookings.forEach(b => {
            console.log(`- ID: ${b._id}, Date: ${b.date.toISOString()}, Time: ${b.startTime}, Status: ${b.status}`);

            const matchExact = b.date.getTime() === bookingDate.getTime();
            console.log(`  Match exact: ${matchExact}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDateQueries();
