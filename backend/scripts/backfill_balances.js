const { sequelize, Patient } = require('../models');
const { updatePatientBalance } = require('../utils/balanceUpdater');

async function backfillBalances() {
    try {
        console.log('🚀 Starting Patient Balance Backfill...');

        // 1. Get all patient IDs
        const patients = await Patient.findAll({ attributes: ['id', 'firstName', 'lastName'] });
        console.log(`Found ${patients.length} patients to update.`);

        let successCount = 0;
        let errorCount = 0;

        // 2. Process each patient
        for (const patient of patients) {
            try {
                process.stdout.write(`Processing Patient ${patient.id} (${patient.firstName} ${patient.lastName})... `);
                const newBalance = await updatePatientBalance(patient.id);
                process.stdout.write(`✅ New Balance: ${newBalance}\n`);
                successCount++;
            } catch (err) {
                process.stdout.write(`❌ FAILED: ${err.message}\n`);
                console.error(err);
                errorCount++;
            }
        }

        console.log('\n================================');
        console.log(`Backfill Complete!`);
        console.log(`Success: ${successCount}`);
        console.log(`Errors:  ${errorCount}`);
        console.log('================================');

    } catch (error) {
        console.error('Fatal Error during backfill:', error);
    } finally {
        await sequelize.close();
    }
}

// Execute the function
backfillBalances();
