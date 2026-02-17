const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
// Use the admin credentials to create a test user
const ADMIN_CREDENTIALS = {
    email: 'admin@medfinance360.com',
    password: 'Admin@123'
};

async function verifyPermissions() {
    try {
        console.log('🔐 Authenticating as Admin...');
        const authResponse = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
        const adminToken = authResponse.data.token;
        const headers = { Authorization: `Bearer ${adminToken}` };

        // 1. Create a Role with READ ONLY permission on patients
        console.log('\n🛠️ Creating "Patient Viewer" Role...');
        const roleData = {
            name: 'Patient Viewer ' + Date.now(),
            description: 'Can only view patients',
            permissions: { patients: ['read'] }
        };
        const roleResponse = await axios.post(`${API_URL}/roles`, roleData, { headers });
        const viewerRoleId = roleResponse.data.id;
        console.log(`✅ Role Created: ID ${viewerRoleId}`);

        // 2. Create a User assigned to this Role
        console.log('\n👤 Creating Test User...');
        const username = `user${Date.now()}`;
        const userData = {
            username: username,
            email: `${username}@test.com`,
            password: 'Password@123',
            firstName: 'Test',
            lastName: 'User',
            roleId: viewerRoleId,
            role: 'viewer' // legacy field
        };
        const userResponse = await axios.post(`${API_URL}/setup/users`, userData, { headers });
        const userId = userResponse.data.id;
        console.log(`✅ User Created: ${username}`);

        // 3. Login as Test User
        console.log('\n🔑 Logging in as Test User...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: userData.email,
            password: userData.password
        });
        const userToken = loginResponse.data.token;
        const userHeaders = { Authorization: `Bearer ${userToken}` };

        // 4. Test READ access (Should Succeed)
        console.log('\n🧪 Testing READ Access (Should Succeed)...');
        try {
            await axios.get(`${API_URL}/patients`, { headers: userHeaders });
            console.log('✅ READ Access Granted');
        } catch (error) {
            console.error('❌ READ Access Failed:', error.response?.data || error.message);
        }

        // 5. Test WRITE access (Should Fail)
        console.log('\n🧪 Testing WRITE Access (Should Fail)...');
        try {
            await axios.post(`${API_URL}/patients`, {
                firstName: 'Test',
                lastName: 'Patient',
                dateOfBirth: '1990-01-01',
                gender: 'Male',
                phoneNumber: '0977000000'
            }, { headers: userHeaders });
            console.error('❌ WRITE Access Unexpectedly Granted!');
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ WRITE Access Correctly Denied (403 Forbidden)');
            } else {
                console.error('⚠️ Unexpected Error:', error.response?.status, error.response?.data);
            }
        }

        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await axios.delete(`${API_URL}/setup/users/${userId}`, { headers }); // Delete user first (if setup route allows)
        // Note: We can't delete the user easily if setup delete route isn't implemented or checks references
        // But we can delete the role if no users are attached. 
        // For this test script, we might leave artifacts if cleanup fails, which is okay for dev.

        console.log('🎉 Permission Verification Completed!');

    } catch (error) {
        console.error('❌ Verification Script Failed:', error.response?.data || error.message);
    }
}

verifyPermissions();
