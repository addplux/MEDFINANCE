require('dotenv').config();
const { Patient, sequelize } = require('./models');
const { Op } = require('sequelize');

async function checkPatients() {
    try {
        // Total count
        const total = await Patient.count();
        console.log(`\n📊 Total patients in DB: ${total}`);

        if (total === 0) {
            console.log('❌ Database has NO patients at all!');
            return;
        }

        // Count by memberRank
        const byRank = await sequelize.query(`
            SELECT COALESCE("memberRank", 'NULL') as rank, COUNT(*) as count 
            FROM patients 
            GROUP BY "memberRank"
            ORDER BY count DESC
        `, { type: sequelize.QueryTypes.SELECT });
        console.log('\n👥 Patients by memberRank:');
        console.table(byRank);

        // Count by costCategory
        const byCost = await sequelize.query(`
            SELECT COALESCE("costCategory", 'NULL') as cost_category, COUNT(*) as count 
            FROM patients 
            GROUP BY "costCategory"
            ORDER BY count DESC
        `, { type: sequelize.QueryTypes.SELECT });
        console.log('\n💰 Patients by costCategory:');
        console.table(byCost);

        // Simulate the onlyPrincipals query exactly as the API does
        const principalCount = await Patient.count({
            where: {
                [Op.and]: [{
                    [Op.or]: [
                        { memberRank: 'principal' },
                        { memberRank: null },
                        { memberRank: '' },
                        { memberRank: 'individual' },
                        { memberRank: 'standard' },
                        { memberRank: 'other' }
                    ]
                }]
            }
        });
        console.log(`\n✅ Patients matched by onlyPrincipals filter: ${principalCount}`);

        // Sample 5 patients
        const samples = await Patient.findAll({ limit: 5, order: [['createdAt', 'DESC']] });
        console.log('\n📋 Last 5 registered patients:');
        console.table(samples.map(p => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            patientNumber: p.patientNumber,
            memberRank: p.memberRank,
            costCategory: p.costCategory,
            paymentMethod: p.paymentMethod
        })));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit();
    }
}

checkPatients();
