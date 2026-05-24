const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Options to handle connection timeouts better
            connectTimeoutMS: 10000, // Give up after 10s if initial connection fails
            serverSelectionTimeoutMS: 10000, // Give up after 10s if server is unreachable
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        try {
            const Session = require('../models/Session');
            await Session.syncIndexes();
        } catch (indexErr) {
            console.warn('Session index sync warning:', indexErr.message);
        }
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Log more detail if it's a timeout
        if (error.message.includes('timeout')) {
            console.error('Hint: Check your MongoDB Atlas Network Access (IP Whitelist).');
        }
        process.exit(1);
    }
};

module.exports = connectDB;
