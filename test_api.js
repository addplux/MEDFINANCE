const axios = require('axios');

async function testLogin() {
    const url = 'https://medfinance-one.vercel.app/api/auth/login';
    console.log(`Testing login at ${url}...`);
    try {
        const response = await axios.post(url, {
            email: 'junk@junk.com',
            password: 'junk'
        });
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLogin();
