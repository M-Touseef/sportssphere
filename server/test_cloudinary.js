require('dotenv').config();
const cloudinary = require('cloudinary').v2;

async function testCloudinary() {
    console.log('--- CLOUDINARY DIAGNOSTIC ---');
    console.log('URL loaded:', !!process.env.CLOUDINARY_URL);

    // Cloudinary SDK automatically picks up CLOUDINARY_URL from process.env
    // if it is set BEFORE the SDK is used.

    try {
        console.log('Attempting upload of sample.jpg...');
        const result = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
            folder: 'debug_test'
        });
        console.log('--- UPLOAD SUCCESS ---');
        console.log('Public ID:', result.public_id);
        console.log('URL:', result.secure_url);
        process.exit(0);
    } catch (err) {
        console.log('--- UPLOAD FAILED ---');
        console.log('Error:', err.message || err);
        if (err.http_code) console.log('HTTP Code:', err.http_code);
        process.exit(0);
    }
}

testCloudinary();
