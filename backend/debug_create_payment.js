require('dotenv').config();
const { Payment, sequelize } = require('./models');

async function debug() {
    const t = await sequelize.transaction();
    try {
        const patientId = 1788; // Mujala
        const amount = 500.00;
        const paymentMethod = 'cash';
        
        const paymentCount = await Payment.count();
        const receiptNumber = `RCP${String(paymentCount + 1).padStart(6, '0')}`;
        console.log('Generated Receipt Number:', receiptNumber);

        const payment = await Payment.create({
            receiptNumber,
            patientId,
            amount,
            paymentMethod,
            paymentDate: new Date(), // Testing new Date() on DATEONLY
            receivedBy: 1 // Assuming 1 exists, wait, let's find a valid user
        }, { transaction: t });

        console.log('Payment created successfully! ID:', payment.id);
        await t.commit();
    } catch (err) {
        console.error('CRASH inside createPayment insert:', err);
        await t.rollback();
    } finally {
        await sequelize.close();
    }
}

debug();
