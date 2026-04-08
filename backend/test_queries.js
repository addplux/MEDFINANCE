require('dotenv').config();
const { Patient, sequelize } = require('./models');
const { Op } = require('sequelize');

async function testQuery(hasCostCategory) {
    try {
        const where = { [Op.and]: [] };
        
        if (hasCostCategory) {
            where[Op.and].push({
                [Op.or]: [
                    { costCategory: 'high_cost' },
                    { costCategory: 'standard' },
                    { costCategory: { [Op.is]: null } },
                    { costCategory: { [Op.notIn]: ['low_cost'] } }
                ]
            });
        }
        
        // onlyPrincipals
        where[Op.and].push({
            [Op.or]: [
                { memberRank: 'principal' },
                { memberRank: null },
                { memberRank: '' },
                { memberRank: 'individual' },
                { memberRank: 'standard' },
                { memberRank: 'other' }
            ]
        });

        const { count, rows } = await Patient.findAndCountAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM visits AS v
                            WHERE v.patient_id = "Patient".id
                        )`),
                        'totalVisits'
                    ]
                ]
            },
            where,
            limit: 15,
            offset: 0,
            order: [['createdAt', 'DESC']]
        });
        
        console.log(`[costCategory=${hasCostCategory}] SUCCESS: found ${count} patients`);
    } catch (err) {
        console.error(`[costCategory=${hasCostCategory}] ERROR:`, err.message);
    }
}

async function run() {
    console.log('--- Testing BOTH queries ---');
    await testQuery(true);
    await testQuery(false);
    process.exit(0);
}

run();
