require('dotenv').config();
const { Payment, sequelize } = require('./models');

async function debug() {
    try {
        const count = await Payment.count();
        const payments = await Payment.findAll({ order: [['id', 'DESC']], limit: 5 });
        
        console.log('Current Payment Count:', count);
        console.log('Last 5 receipts in DB:');
        console.log(payments.map(p => ({
            id: p.id,
            receiptNumber: p.receiptNumber,
            amount: p.amount
        })));
        
    } catch (err) {
        console.error('Error debugging:', err);
    } finally {
        await sequelize.close();
    }
}

debug();
