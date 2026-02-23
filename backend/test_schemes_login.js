const http = require('http');

function post(path, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const opts = { hostname: 'localhost', port: 5000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': body.length } };
        const req = http.request(opts, res => {
            let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function get(path, token) {
    return new Promise((resolve, reject) => {
        const opts = { hostname: 'localhost', port: 5000, path, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } };
        const req = http.request(opts, res => {
            let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('1. Logging in...');
    const login = await post('/api/auth/login', { email: 'admin@medfinance360.com', password: 'admin1234' });
    console.log('   Login status:', login.status);
    if (login.status !== 200) { console.error('   Login FAILED:', login.body); return; }
    const { token } = JSON.parse(login.body);
    console.log('   ✅ Got token:', token.substring(0, 40) + '...');

    console.log('2. Fetching schemes...');
    const schemes = await get('/api/receivables/schemes?status=active', token);
    console.log('   Schemes status:', schemes.status);
    if (schemes.status === 200) {
        const data = JSON.parse(schemes.body);
        console.log('   ✅ Schemes:', data.map(s => `${s.schemeName} (${s.schemeType})`));
    } else {
        console.error('   ❌ FAILED:', schemes.body);
    }
}

main().catch(console.error);
