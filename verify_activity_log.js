const { Patient, Visit, PatientMovement, User, FileRequest, sequelize } = require('./backend/models');
const { getActivityLog } = require('./backend/controllers/recordsController');

async function testActivityLog() {
    try {
        console.log('Connecting to DB...');
        await sequelize.authenticate();
        console.log('Testing Activity Log Logic...');
        
        // Mock req and res
        const req = {
            query: { limit: 5 },
            user: { id: 1 }
        };
        const res = {
            json: (data) => console.log('SUCCESS Response length:', data.length),
            status: (code) => {
                console.log('FAILED with Status:', code);
                return { json: (err) => console.error('Error Details:', err) };
            }
        };

        await getActivityLog(req, res);
    } catch (error) {
        console.error('Test script failed:', error);
    } finally {
        await sequelize.close();
    }
}

testActivityLog();
