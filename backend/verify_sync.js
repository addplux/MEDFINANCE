require('dotenv').config();
const { Patient, Scheme, PharmacyBill } = require('./models');
const { updatePatientBalance } = require('./utils/balanceUpdater');

async function verify() {
    try {
        console.log('--- Verification Started ---');

        // 1. Find Chisomo
        console.log('Searching for patient Chisomo Banda...');
        const patient = await Patient.findOne({
            where: { firstName: 'Chisomo', lastName: 'Banda' },
            include: [{ model: Scheme, as: 'scheme' }]
        });

        if (!patient) {
            console.log('❌ Patient Chisomo Banda not found');
            const allPatients = await Patient.findAll({ limit: 5 });
            console.log('Some existing patients:', allPatients.map(p => `${p.firstName} ${p.lastName}`).join(', '));
            return;
        }

        console.log(`✅ Found Patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
        console.log(`Current Patient Balance: K${patient.balance}`);
        console.log(`Scheme: ${patient.scheme ? patient.scheme.schemeName : 'None'}`);
        console.log(`Current Scheme Outstanding: K${patient.scheme ? patient.scheme.outstandingBalance : 'N/A'}`);

        // 2. Force a balance update
        console.log('--- Triggering Balance Update ---');
        const newBalance = await updatePatientBalance(patient.id);
        console.log(`Update function returned: K${newBalance}`);

        // 3. Re-fetch
        const updatedPatient = await Patient.findByPk(patient.id, {
            include: [{ model: Scheme, as: 'scheme' }]
        });
        console.log(`Updated Patient Balance (from DB): K${updatedPatient.balance}`);
        console.log(`Updated Scheme Outstanding (from DB): K${updatedPatient.scheme ? updatedPatient.scheme.outstandingBalance : 'N/A'}`);

        if (updatedPatient.scheme && updatedPatient.scheme.outstandingBalance > 0) {
            console.log('🚀 SUCCESS: Scheme balance is now tracked!');
        } else {
            console.log('⚠️ Scheme balance is still 0. Check if there are any bills.');
            const billCount = await PharmacyBill.count({ where: { patientId: patient.id } });
            console.log(`Pharmacy bills for this patient: ${billCount}`);
        }

        console.log('--- Verification Finished ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

verify();
