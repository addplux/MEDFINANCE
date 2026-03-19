require('dotenv').config();
const { updatePatientBalance } = require('./utils/balanceUpdater');
const { sequelize } = require('./models');

async function debug() {
    try {
        console.log('Running updatePatientBalance for patient 1788...');
        const result = await updatePatientBalance(1788);
        console.log('Success! New balance calculated:', result);
    } catch (err) {
        console.error('CRASH DETECTED inside updatePatientBalance:', err);
    } finally {
        await sequelize.close();
    }
}

debug();
