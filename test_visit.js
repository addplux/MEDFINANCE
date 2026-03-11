const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { Visit, Patient, Department, Vitals, Admission, Bed, Ward } = require('./backend/models');

async function testVisit(id) {
    try {
        console.log(`Fetching visit ${id}...`);
        const visit = await Visit.findByPk(id, {
            include: [
                { model: Patient, as: 'patient' },
                { model: Department, as: 'department' },
                { model: Vitals, as: 'vitals' }
            ]
        });

        if (!visit) {
            console.log('Visit not found');
            process.exit(0);
        }

        console.log('Visit fetched successfully');

        console.log(`Fetching admissions for patient ${visit.patientId}...`);
        const admissions = await Admission.findAll({
            where: { patientId: visit.patientId },
            include: [{ model: Bed, as: 'bed', include: [{ model: Ward, as: 'ward' }] }],
            order: [['admissionDate', 'DESC']]
        });

        console.log(`Found ${admissions.length} admissions.`);
        console.log('Success!');
    } catch (e) {
        console.error('ERROR OCCURRED:', e);
    } finally {
        process.exit(0);
    }
}

testVisit(23);
