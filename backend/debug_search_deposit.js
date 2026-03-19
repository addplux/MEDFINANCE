require('dotenv').config();
const { Payment, sequelize } = require('./models');
const { Op } = require('sequelize');

async function debug() {
    try {
        const payments = await Payment.findAll({
            where: {
                notes: {
                    [Op.iLike]: '%Deposit%'
                }
            }
        });
        
        console.log(`Found ${payments.length} deposit payments in total`);
        console.log(payments.map(p => ({
            id: p.id,
            patientId: p.patientId,
            amount: p.amount,
            notes: p.notes,
            paymentDate: p.paymentDate
        })));
        
    } catch (err) {
        console.error('Error debugging:', err);
    } finally {
        await sequelize.close();
    }
}

debug();
