const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const users = await User.find({
        verificationDocument: { $exists: true, $ne: '' },
        status: 'waiting_for_approval'
    }).select('name verificationDocument');

    users.forEach(u => {
        console.log('User:', u.name);
        console.log('Raw doc path:', JSON.stringify(u.verificationDocument));

        // Simulate what getDocumentUrl does
        const docPath = u.verificationDocument;
        const cleanPath = docPath.replace(/^uploads[\/\\]/, '');
        const finalUrl = `http://localhost:5000/uploads/${cleanPath}`;
        console.log('Clean path:', cleanPath);
        console.log('Final URL:', finalUrl);
        console.log('---');
    });

    process.exit(0);
}).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
