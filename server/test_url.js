const http = require('http');

const url = 'http://localhost:5000/uploads/verification_docs/verificationDocument-1770154453894-554455750.png';

http.get(url, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Content-Length:', res.headers['content-length']);
}).on('error', (e) => {
    console.error('Error:', e.message);
});
