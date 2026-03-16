const https = require('https');

const loginData = JSON.stringify({
    email: 'admin@medfinance360.com',
    password: 'Admin@123',
    hospitalType: ''
});

const req = https.request('https://medfinance-production.up.railway.app/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const result = JSON.parse(data);
        if (!result.token) {
            console.error('Login Failed:', result);
            return;
        }
        
        console.log('Login Success. Fetching Activity Log...');
        
        const testRequest = https.request('https://medfinance-production.up.railway.app/api/records/requests', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + result.token }
        }, (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2 += chunk);
            res2.on('end', () => {
                console.log('Requests Endpoint Response:', res2.statusCode);
                console.log(data2);
                
                const testActivity = https.request('https://medfinance-production.up.railway.app/api/records/activity', {
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + result.token }
                }, (res3) => {
                    let data3 = '';
                    res3.on('data', chunk => data3 += chunk);
                    res3.on('end', () => {
                        console.log('Activity Endpoint Response:', res3.statusCode);
                        console.log(data3);
                    });
                });
                testActivity.end();
            });
        });
        testRequest.end();
    });
});

req.on('error', console.error);
req.write(loginData);
req.end();
