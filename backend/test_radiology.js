require('./config/database').testConnection().then(async () => {
    try {
        const Patient = require('./models/Patient');
        const Service = require('./models/Service');

        // Find an active patient to ensure test passes patient check
        const patient = await Patient.findOne({ where: { status: 'active' } });
        if (!patient) { console.log('No active patient'); return process.exit(0); }

        // Find any service
        const service = await Service.findOne();

        const rc = require('./controllers/radiologyController');
        const req = {
            body: {
                patientId: patient.id,
                serviceIds: [service.id],
                priority: 'routine',
                clinicalNotes: 'Test diagnostic'
            },
            user: { id: 1 } // assuming user 1 is admin
        };
        const res = {
            status: (code) => { console.log('HTTP STATUS:', code); return res; },
            json: (data) => console.log('HTTP JSON RESPONSE:', data)
        };

        await rc.createRequest(req, res);
    } catch (e) {
        console.error('FATAL ERROR:', e);
    }
    process.exit(0);
});
