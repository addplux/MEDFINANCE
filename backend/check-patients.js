const { Patient } = require('./models');
const { Sequelize } = require('sequelize');

async function checkPatients() {
    try {
        const count = await Patient.count();
        console.log('Total patients in database:', count);
        
        if (count > 0) {
            const first = await Patient.findOne({ order: [['createdAt', 'DESC']] });
            console.log('Latest patient createdAt:', first.createdAt);
            console.log('Latest patient ID:', first.id);
            console.log('Latest patient name:', first.firstName, first.lastName);
        }
        
    } catch (error) {
        console.error('Error checking patients:', error);
    } finally {
        process.exit();
    }
}

checkPatients();
