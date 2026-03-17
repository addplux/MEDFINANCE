const { Patient } = require('./backend/models');

async function checkFamily() {
    try {
        const principal = await Patient.findOne({ where: { patientNumber: '20140914-01' } });
        if (!principal) {
            console.log('Principal not found');
            return;
        }
        console.log('Principal:', principal.firstName, principal.lastName, 'Policy:', principal.policyNumber);
        
        const family = await Patient.findAll({
            where: { policyNumber: principal.policyNumber }
        });
        
        console.log('Found', family.length, 'total patients with this policy number.');
        family.forEach(f => {
            console.log(`- [${f.id}] ${f.firstName} ${f.lastName} (${f.memberRank})`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkFamily();
