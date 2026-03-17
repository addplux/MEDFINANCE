const { Patient, sequelize } = require('./backend/models');

async function checkPatients() {
    try {
        const stats = await Patient.findAll({
            attributes: [
                'memberRank',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['memberRank'],
            raw: true
        });
        
        console.log('--- PATIENT MEMBER RANK STATS ---');
        stats.forEach(s => {
            console.log(`Rank: ${s.memberRank || 'NULL'}, Count: ${s.count}`);
        });

        const samples = await Patient.findAll({ limit: 5, raw: true });
        console.log('\n--- SAMPLE PATIENTS ---');
        samples.forEach(p => {
            console.log(`Name: ${p.firstName} ${p.lastName}, Rank: ${p.memberRank}, Policy: ${p.policyNumber}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkPatients();
