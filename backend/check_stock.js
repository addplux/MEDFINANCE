const { Medication, PharmacyBatch } = require('./models');
const { Op } = require('sequelize');

async function checkStock() {
    try {
        const meds = await Medication.findAll({
            include: [{
                model: PharmacyBatch,
                as: 'batches',
                where: { quantityOnHand: { [Op.gt]: 0 }, expiryDate: { [Op.gt]: new Date() } },
                required: true // Change to true to see ONLY those with stock
            }]
        });
        
        console.log(`Found ${meds.length} medications with stock.`);
        meds.forEach(m => {
            const total = m.batches.reduce((sum, b) => sum + b.quantityOnHand, 0);
            console.log(`- ${m.name} (isActive: ${m.isActive}): ${total} total stock`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStock();
