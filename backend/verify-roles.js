const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@medfinance360.com',
    password: 'Admin@123'
};

async function verifyRoles() {
    try {
        console.log('🔐 Authenticating as Admin...');
        const authResponse = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
        const token = authResponse.data.token;
        console.log('✅ Authentication successful');

        const headers = { Authorization: `Bearer ${token}` };

        console.log('\n📜 Fetching all roles...');
        const rolesResponse = await axios.get(`${API_URL}/roles`, { headers });
        console.log(`✅ Fetched ${rolesResponse.data.length} roles`);
        rolesResponse.data.forEach(role => {
            console.log(`   - ${role.name} (${role.isSystem ? 'System' : 'Custom'})`);
        });

        console.log('\n✨ Creating a new test role...');
        const newRoleData = {
            name: 'Test Role ' + Date.now(),
            description: 'A temporary test role',
            permissions: { test: ['read'] }
        };
        const createResponse = await axios.post(`${API_URL}/roles`, newRoleData, { headers });
        const createdRole = createResponse.data;
        console.log(`✅ Created role: ${createdRole.name} (ID: ${createdRole.id})`);

        console.log('\n✏️ Updating the test role...');
        const updateData = {
            name: createdRole.name + ' Updated',
            description: 'Updated description',
            permissions: { test: ['read', 'write'] }
        };
        const updateResponse = await axios.put(`${API_URL}/roles/${createdRole.id}`, updateData, { headers });
        console.log(`✅ Updated role: ${updateResponse.data.name}`);

        console.log('\n🗑️ Deleting the test role...');
        await axios.delete(`${API_URL}/roles/${createdRole.id}`, { headers });
        console.log('✅ Deleted role');

        console.log('\n🎉 Verification completed!');
    } catch (error) {
        console.error('❌ Verification failed:', error.response?.data || error.message);
    }
}

verifyRoles();
