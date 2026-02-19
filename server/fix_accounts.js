const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportsphere');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const fixAccounts = async () => {
    await connectDB();

    try {
        // Fix Admins
        // Assuming emails containing 'admin' or the known sadmin email
        const admins = await User.find({ $or: [{ email: /admin/i }, { role: 'admin' }] });
        for (const admin of admins) {
            console.log(`Fixing Admin: ${admin.email}`);
            admin.role = 'admin';
            admin.verified = true;
            await admin.save();
        }

        // Fix Coaches
        // Assuming emails containing 'coach'
        const coaches = await User.find({ $or: [{ email: /coach/i }, { role: 'coach' }] });
        for (const coach of coaches) {
            console.log(`Fixing Coach: ${coach.email}`);
            coach.role = 'coach';
            coach.verified = true; // Force verify for testing
            await coach.save();
        }

        // Fix "Professional" role errors (change to player + professional skill)
        const brokenPros = await User.find({ role: 'professional' });
        for (const pro of brokenPros) {
            console.log(`Fixing Broken Pro: ${pro.email}`);
            pro.role = 'player';
            pro.skillLevel = 'professional';
            pro.verified = true;
            await pro.save();
        }

        console.log('--- Account Fix Complete ---');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

fixAccounts();
