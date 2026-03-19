const { Patient, Visit, Vitals } = require('./models');

async function check() {
    try {
        const patient = await Patient.findOne({ where: { patientNumber: 'PPR000114' } });
        if (!patient) {
            console.log("Patient not found!");
            return;
        }
        console.log(`Found Patient ID: ${patient.id} (${patient.firstName} ${patient.lastName})`);

        const visits = await Visit.findAll({
            where: { patientId: patient.id },
            order: [['createdAt', 'DESC']]
        });

        console.log(`\n--- Visits (${visits.length}) ---`);
        for (const v of visits) {
            const vitals = await Vitals.findOne({ where: { visitId: v.id } });
            console.log(`Visit ID: ${v.id} | Status: ${v.status} | Queue: ${v.queueStatus} | Vitals recorded: ${vitals ? 'YES' : 'NO'} | Created: ${v.createdAt}`);
            if (vitals) {
                console.log(`   Vitals ID: ${vitals.id} | BP: ${vitals.bloodPressure} | Created: ${vitals.createdAt}`);
            }
        }

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

check();
