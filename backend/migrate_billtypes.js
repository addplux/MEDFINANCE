const { Payment, OPDBill, PharmacyBill, LabBill, RadiologyBill, sequelize } = require('./models');

async function migrateNullBillTypes() {
    console.log('--- Starting migration of NULL billType records ---');
    const t = await sequelize.transaction();
    try {
        // Find payments with billType = null
        const payments = await Payment.findAll({
            where: { billType: null },
            transaction: t
        });

        console.log(`Found ${payments.length} payments with NULL billType.`);

        let updatedCount = 0;
        let mapping = {
            OPD: 0,
            Pharmacy: 0,
            Laboratory: 0,
            Radiology: 0
        };

        for (const payment of payments) {
            let inferredType = null;

            // Check if it's a pre-registration (based on notes)
            if (payment.notes && payment.notes.toLowerCase().includes('registration')) {
                inferredType = 'opd';
            } else if (payment.billId) {
                // Try to find which bill model this ID belongs to
                // Start with OPD as it's the most common
                const opd = await OPDBill.findByPk(payment.billId, { transaction: t });
                if (opd) inferredType = 'opd';
                else {
                    const pharm = await PharmacyBill.findByPk(payment.billId, { transaction: t });
                    if (pharm) inferredType = 'pharmacy';
                    else {
                        const lab = await LabBill.findByPk(payment.billId, { transaction: t });
                        if (lab) inferredType = 'laboratory';
                        else {
                            const radio = await RadiologyBill.findByPk(payment.billId, { transaction: t });
                            if (radio) inferredType = 'radiology';
                        }
                    }
                }
            }

            if (inferredType) {
                await payment.update({ billType: inferredType }, { transaction: t });
                updatedCount++;
                if (inferredType === 'opd') mapping.OPD++;
                else if (inferredType === 'pharmacy') mapping.Pharmacy++;
                else if (inferredType === 'laboratory') mapping.Laboratory++;
                else if (inferredType === 'radiology') mapping.Radiology++;
            }
        }

        await t.commit();
        console.log(`Success! Updated ${updatedCount} records.`);
        console.log(`Breakdown: OPD:${mapping.OPD}, Pharmacy:${mapping.Pharmacy}, Lab:${mapping.Laboratory}, Radiology:${mapping.Radiology}`);
    } catch (error) {
        await t.rollback();
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

migrateNullBillTypes();
