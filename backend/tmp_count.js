require('dotenv').config();
const { Patient, sequelize } = require('./models');
const { Op } = require('sequelize');

async function run() {
    // 1. Total patients
    const total = await Patient.count();
    console.log('TOTAL_PATIENTS=' + total);

    if (total === 0) {
        console.log('NO_PATIENTS_IN_DB');
        process.exit(0);
    }

    // 2. Patients by memberRank using Sequelize (not raw SQL)
    const nullRank = await Patient.count({ where: { memberRank: null } });
    const principalRank = await Patient.count({ where: { memberRank: 'principal' } });
    const spouseRank = await Patient.count({ where: { memberRank: 'spouse' } });
    const childRank = await Patient.count({ where: { memberRank: 'child' } });
    const otherRank = await Patient.count({ where: { memberRank: 'other' } });
    const dependantRank = await Patient.count({ where: { memberRank: 'dependant' } });

    console.log('RANK_null=' + nullRank);
    console.log('RANK_principal=' + principalRank);
    console.log('RANK_spouse=' + spouseRank);
    console.log('RANK_child=' + childRank);
    console.log('RANK_other=' + otherRank);
    console.log('RANK_dependant=' + dependantRank);

    // 3. Simulate the exact onlyPrincipals filter
    const principalFilter = await Patient.count({
        where: {
            [Op.and]: [{
                [Op.or]: [
                    { memberRank: 'principal' },
                    { memberRank: null },
                    { memberRank: 'other' }
                ]
            }]
        }
    });
    console.log('ONLY_PRINCIPALS_FILTER_RESULT=' + principalFilter);

    // 4. Sample 3 patients
    const samples = await Patient.findAll({ limit: 3, order: [['createdAt', 'DESC']] });
    samples.forEach((p, i) => {
        console.log(`SAMPLE${i}=${p.firstName} ${p.lastName}|rank=${p.memberRank}|cost=${p.costCategory}|payment=${p.paymentMethod}`);
    });

    process.exit(0);
}

run().catch(e => { console.log('ERR=' + e.message); process.exit(1); });
