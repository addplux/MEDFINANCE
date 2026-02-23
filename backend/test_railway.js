const jwt = require('jsonwebtoken');
const https = require('https');

const token = jwt.sign(
    { id: 1, role: 'admin' },
    'medfinance360-super-secret-jwt-key-change-in-production-min-32-chars',
    { expiresIn: '1h' }
);

const options = {
    hostname: 'medfinance-production.up.railway.app',
    port: 443,
    path: '/api/receivables/schemes?status=active',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.end();
