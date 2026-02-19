const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://sportssphere3_db_user:O03Po29JBK5RQNMH@cluster0.tgcxlyr.mongodb.net/sportssphere?retryWrites=true&w=majority&appName=Cluster0';

async function checkUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({
            verificationDocument: { $exists: true, $ne: '' }
        }).select('name email verificationDocument status');

        console.log('--- USERS WITH DOCUMENTS ---');
        console.log(JSON.stringify(users, null, 2));
        console.log('----------------------------');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkUsers();
