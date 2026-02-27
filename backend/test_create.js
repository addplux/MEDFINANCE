const { sequelize, Patient } = require('./models');

async function testCreate() {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();

        const t = await sequelize.transaction();
        console.log('Transaction started');
        try {
            const payload = {
                patientNumber: 'TEST-12345',
                firstName: 'JOHN',
                lastName: 'DOE',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'other',
                paymentMethod: 'private_prepaid',
                costCategory: 'high_cost',
                patientType: 'opd',
                schemeId: null,
                policyNumber: '20180707',
                balance: 100,
                prepaidCredit: 100
            };
            const patient = await Patient.create(payload, { transaction: t });
            console.log('Success:', patient.id);
            await t.rollback();
        } catch (e) {
            console.error('ERR:', e.message);
            console.error('STACK:', e.stack);
            await t.rollback();
        }
    } catch (err) {
        console.error('CONNECT ERR:', err);
    } finally {
        await sequelize.close();
    }
}

testCreate();
