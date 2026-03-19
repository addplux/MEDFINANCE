require('dotenv').config();
const { Payment, Patient, sequelize } = require('./models');
const { Op } = require('sequelize');

async function debug() {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const payments = await Payment.findAll({
            where: {
                createdAt: {
                    [Op.gte]: today
                }
            },
            include: [{ model: Patient, as: 'patient' }]
        });
        
        console.log(`Found ${payments.length} payments today`);
        console.log(payments.map(p => ({
            id: p.id,
            receiptNumber: p.receiptNumber,
            patientId: p.patientId,
            amount: p.amount,
            notes: p.notes,
            patient: p.patient ? `${p.patient.firstName} ${p.patient.lastName} (${p.patient.patientNumber})` : 'No Patient'
        })));
        
    } catch (err) {
        console.error('Error debugging:', err);
    } finally {
        await sequelize.close();
    }
}

debug();
