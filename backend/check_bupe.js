const { Patient, Scheme, CorporateAccount, LabRequest } = require('./models');

async function checkPatient() {
    try {
        const patient = await Patient.findOne({
            where: { firstName: 'Bupe', lastName: 'Mwewa' },
            include: [{ model: Scheme, as: 'scheme' }]
        });

        if (!patient) {
            console.log('Patient Bupe Mwewa not found');
            process.exit(1);
        }

        console.log('--- Patient Details ---');
        console.log(`ID: ${patient.id}`);
        console.log(`Payment Method: ${patient.paymentMethod}`);
        console.log(`Policy Number: ${patient.policyNumber}`);
        console.log(`Scheme ID: ${patient.schemeId}`);
        console.log(`Scheme Name: ${patient.scheme ? patient.scheme.schemeName : 'None'}`);
        console.log(`Balance: ${patient.balance}`);

        const labRequests = await LabRequest.findAll({
            where: { patientId: patient.id }
        });
        console.log('\n--- Lab Requests ---');
        labRequests.forEach(r => {
            console.log(`Request: ${r.requestNumber}, Total: ${r.totalAmount}, Payment Status: ${r.paymentStatus}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

checkPatient();
