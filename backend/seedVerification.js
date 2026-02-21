const { Patient, OPDBill, Service, User, sequelize } = require('./models');

const simulateOverdueBills = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        // Create a fake patient or find first
        let patient = await Patient.findOne();
        if (!patient) {
            patient = await Patient.create({
                firstName: 'Test',
                lastName: 'Verify',
                phone: '1234567890',
                email: 'test@example.com',
                paymentMethod: 'cash',
                balance: 3000
            });
            console.log('Created test patient');
        } else {
            // Ensure they have email/phone
            patient.email = 'test@example.com';
            patient.phone = '1234567890';
            patient.paymentMethod = 'cash';
            await patient.save();
        }

        let user = await User.findOne();

        // Create a service
        let service = await Service.findOne();
        if (!service) {
            service = await Service.create({
                serviceCode: 'TEST01',
                serviceName: 'Test Service',
                category: 'opd',
                price: 1000
            });
        }

        const today = new Date();
        const days35Ago = new Date(today);
        days35Ago.setDate(today.getDate() - 35);

        const days65Ago = new Date(today);
        days65Ago.setDate(today.getDate() - 65);

        const days95Ago = new Date(today);
        days95Ago.setDate(today.getDate() - 95);

        // create 3 bills
        await OPDBill.create({
            billNumber: 'TEST-30',
            patientId: patient.id,
            serviceId: service.id,
            quantity: 1,
            unitPrice: 1000,
            totalAmount: 1000,
            netAmount: 1000,
            paymentMethod: 'cash',
            createdBy: user ? user.id : 1,
            createdAt: days35Ago
        });

        await OPDBill.create({
            billNumber: 'TEST-60',
            patientId: patient.id,
            serviceId: service.id,
            quantity: 1,
            unitPrice: 1000,
            totalAmount: 1000,
            netAmount: 1000,
            paymentMethod: 'cash',
            createdBy: user ? user.id : 1,
            createdAt: days65Ago
        });

        await OPDBill.create({
            billNumber: 'TEST-90',
            patientId: patient.id,
            serviceId: service.id,
            quantity: 1,
            unitPrice: 1000,
            totalAmount: 1000,
            netAmount: 1000,
            paymentMethod: 'cash',
            createdBy: user ? user.id : 1,
            createdAt: days95Ago
        });

        console.log('Test setup complete. Added 3 overdue bills for patient ' + patient.id);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

simulateOverdueBills();
