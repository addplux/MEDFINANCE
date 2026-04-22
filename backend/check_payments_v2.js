const { Payment, sequelize } = require('./models');

async function checkPayments() {
    try {
        const counts = await Payment.findAll({
            attributes: [
                'billType',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['billType'],
            raw: true
        });
        console.log('Payment BillType Counts:');
        console.log(JSON.stringify(counts, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkPayments();
