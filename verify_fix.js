const { reportsAPI } = require('./services/apiService');
const axios = require('axios');

async function testReport() {
    try {
        // Need to mock axios or use a real token. Since I'm in the backend environment, I'll just check the DB counts again.
        const { Payment, sequelize } = require('./backend/models');
        const counts = await Payment.findAll({
            attributes: [
                'billType',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['billType'],
            raw: true
        });
        console.log('New Payment BillType Counts:');
        console.log(JSON.stringify(counts, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

// Just checking DB side since I can't easily hit the API with a valid token without more setup
testReport();
