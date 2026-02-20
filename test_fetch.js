const fetch = require('node-fetch');

async function run() {
    try {
        // We'll just login to get a token
        const loginRes = await fetch('https://medfinance-production.up.railway.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@medfinance360.com', password: 'Admin@123' }) // Assuming default
        });

        const loginData = await loginRes.json();
        if (!loginData.token) {
            console.log('Login failed', loginData);
            return;
        }

        const res = await fetch('https://medfinance-production.up.railway.app/api/receivables/schemes?status=active', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        const data = await res.json();
        console.log('Schemes data:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error(e);
    }
}
run();
