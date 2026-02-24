const { Patient, Scheme } = require('./models');

async function countMembers() {
    try {
        const schemeId = 2; // Madison Health Insurance ID from schemes_dump.json
        const count = await Patient.count({
            where: { schemeId }
        });

        const scheme = await Scheme.findByPk(schemeId);
        console.log(`--- Member Count Report ---`);
        console.log(`Scheme: ${scheme ? scheme.schemeName : 'Unknown'} (${scheme ? scheme.schemeCode : 'N/A'})`);
        console.log(`Total Members: ${count}`);

        // Also check if there are any other possible links (e.g. by policyNumber prefix)
        const policyCount = await Patient.count({
            where: {
                policyNumber: {
                    [require('sequelize').Op.iLike]: 'MAD%'
                }
            }
        });
        console.log(`Patients with policy starting with 'MAD': ${policyCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Count failed:', error);
        process.exit(1);
    }
}

countMembers();
