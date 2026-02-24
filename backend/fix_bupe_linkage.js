const { Patient, Scheme } = require('./models');

async function fixBupe() {
    try {
        // Find Zambia Sugar Corporate
        const scheme = await Scheme.findOne({
            where: { schemeCode: 'CORP01' }
        });

        if (!scheme) {
            console.log('Scheme CORP01 not found');
            process.exit(1);
        }

        const patient = await Patient.findOne({
            where: { firstName: 'Bupe', lastName: 'Mwewa' }
        });

        if (!patient) {
            console.log('Patient Bupe Mwewa not found');
            process.exit(1);
        }

        await patient.update({
            schemeId: scheme.id,
            paymentMethod: 'corporate'
        });

        console.log(`Successfully linked Bupe Mwewa to ${scheme.schemeName}`);
        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
}

fixBupe();
