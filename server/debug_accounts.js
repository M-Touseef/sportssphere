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

const debugAccounts = async () => {
    await connectDB();

    try {
        const users = await User.find({});
        console.log('--- User Accounts Debug ---');
        users.forEach(u => {
            console.log(`Email: ${u.email} | Name: ${u.name} | Role: '${u.role}' | Verified: ${u.verified} | Skill: '${u.skillLevel}'`);
        });
        console.log('---------------------------');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

debugAccounts();
