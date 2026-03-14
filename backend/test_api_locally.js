const axios = require('axios');

async function test() {
    // We can't hit the external URL easily without a token, 
    // but we can simulate the controller call locally.
    const { getAllPatients } = require('./controllers/patientController');
    const { getStats } = require('./controllers/recordsController');
    
    const mockRes = {
        json: (data) => {
            console.log('API Response:', JSON.stringify(data, null, 2));
        },
        status: (code) => {
            console.log('Status Code:', code);
            return mockRes;
        }
    };

    console.log('--- Testing getAllPatients ---');
    await getAllPatients({ query: { limit: 10 } }, mockRes);

    console.log('\n--- Testing getStats ---');
    await getStats({}, mockRes);
}

test().then(() => process.exit());
