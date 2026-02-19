require('dotenv').config();
const cloudinary = require('cloudinary').v2;

async function listResources() {
    console.log('--- CLOUDINARY RESOURCE LIST ---');
    try {
        const result = await cloudinary.api.resources({
            max_results: 10,
            type: 'upload'
        });

        console.log('Total Resources found:', result.resources.length);
        result.resources.forEach(res => {
            console.log(`- [${res.created_at}] ${res.public_id} (${res.secure_url})`);
        });

        process.exit(0);
    } catch (err) {
        console.log('--- API CALL FAILED ---');
        console.log('Error:', err.message || err);
        process.exit(0);
    }
}

listResources();
