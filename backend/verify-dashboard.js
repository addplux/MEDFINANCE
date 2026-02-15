const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyDashboard() {
    try {
        // 1. Login
        console.log('Attempting to login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@medfinance360.com',
            password: 'Admin@123'
        });

        if (loginResponse.data.token) {
            console.log('✅ Login Successful');
            const token = loginResponse.data.token;

            // 2. Fetch Dashboard Data
            console.log('Fetching dashboard overview...');
            const dashboardResponse = await axios.get(`${API_URL}/dashboard/overview`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Dashboard Data Retrieved:', dashboardResponse.data);
        } else {
            console.error('❌ Login Failed: No token received');
        }
    } catch (error) {
        console.error('❌ Verification Failed:', error.response ? error.response.data : error.message);
    }
}

verifyDashboard();
