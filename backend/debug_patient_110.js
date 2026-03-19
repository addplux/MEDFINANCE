require('dotenv').config();
const { Patient, Payment, sequelize } = require('./models');

async function debug() {
    try {
        const patient = await Patient.findOne({ where: { patientNumber: 'P000110' } });
        console.log('--- PATIENT ---');
        console.log(patient ? patient.toJSON() : 'Patient not found');
        
        if (patient) {
            const payments = await Payment.findAll({ where: { patientId: patient.id } });
            console.log('\n--- PAYMENTS ---');
            console.log(payments.map(p => p.toJSON()));
            
            const totalPaid = await Payment.sum('amount', { where: { patientId: patient.id } });
            console.log('\n--- TOTAL SUM PAID ---', totalPaid);
        }
    } catch (err) {
        console.error('Error debugging:', err);
    } finally {
        await sequelize.close();
    }
}

debug();
