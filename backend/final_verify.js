const { Payment, sequelize } = require('./models');

async function verify() {
    try {
        const counts = await Payment.findAll({
            attributes: [
                'billType',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['billType'],
            raw: true
        });
        console.log('Final Verification Counts:');
        console.log(JSON.stringify(counts, null, 2));
    } catch (e) { console.error(e); }
    finally { await sequelize.close(); }
}

verify();
