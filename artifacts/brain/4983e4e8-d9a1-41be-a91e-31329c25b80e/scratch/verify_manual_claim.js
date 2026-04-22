const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testSubmitManualClaim() {
    const baseUrl = 'http://localhost:5000/api/receivables';
    const JWT_SECRET = 'medfinance360-super-secret-jwt-key-change-in-production-min-32-chars';

    try {
        console.log('Generating admin token...');
        const token = jwt.sign(
            { id: 1, email: 'admin@medfinance360.com', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log('Submitting manual claim...');
        const payload = {
            manNo: 'TEST-MAN-002',
            invoiceNo: 'TEST-INV-888',
            patientName: 'Jane Doe Test',
            schemeId: 1, // Ensure a scheme with ID 1 exists
            charges: {
                consultation: 200.00,
                nurseCare: 50.00
            },
            agreement: true
        };

        const claimRes = await axios.post(`${baseUrl}/invoices/manual-claim`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Response Status:', claimRes.status);
        console.log('Response Data:', JSON.stringify(claimRes.data, null, 2));

    } catch (error) {
        console.error('Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testSubmitManualClaim();
