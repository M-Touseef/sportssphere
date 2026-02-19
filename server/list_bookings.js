const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function listBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const bookings = await db.collection('bookings').find({}).toArray();

        console.log(`Total Bookings: ${bookings.length}`);
        bookings.slice(-10).forEach(b => {
            console.log(`ID: ${b._id}`);
            console.log(`  Court: ${b.court}`);
            console.log(`  Date: ${b.date} (${new Date(b.date).toISOString()})`);
            console.log(`  StartTime: "${b.startTime}"`);
            console.log(`  Status: "${b.status}"`);
            console.log('---');
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

listBookings();
