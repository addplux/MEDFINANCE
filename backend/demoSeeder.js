const {
    User, Patient, Service, Invoice, InvoiceItem,
    Payment, ChartOfAccounts, Department, Organization
} = require('./models');
const { sequelize } = require('./config/database');

const seedDemoData = async () => {
    try {
        console.log('🌱 Starting Demo Data Seeding...');

        // 1. Get existing data references
        const adminUser = await User.findOne({ where: { role: 'admin' } });
        const opdService = await Service.findOne({ where: { serviceCode: 'OPD001' } });
        const labService = await Service.findOne({ where: { serviceCode: 'LAB001' } });

        if (!adminUser || !opdService) {
            console.error('❌ Base data missing. Run "npm run seed" first.');
            process.exit(1);
        }

        console.log('📊 Creating Patients...');
        const patients = await Patient.bulkCreate([
            {
                firstName: 'James', lastName: 'Phiri', dateOfBirth: '1985-05-12',
                gender: 'Male', phone: '0977000001', email: 'james@test.com',
                address: '123 Cairo Road, Lusaka', paymentMethod: 'cash'
            },
            {
                firstName: 'Sarah', lastName: 'Bwalya', dateOfBirth: '1992-08-23',
                gender: 'Female', phone: '0966000002', email: 'sarah@test.com',
                address: '45 Independence Ave, Lusaka', paymentMethod: 'insurance',
                insuranceProvider: 'Madison', insurancePolicyNumber: 'MED-2024-001'
            },
            {
                firstName: 'Peter', lastName: 'Mulenga', dateOfBirth: '1978-11-30',
                gender: 'Male', phone: '0955000003', email: 'peter@test.com',
                address: '77 Kabulonga, Lusaka', paymentMethod: 'nhima',
                nhimaNumber: 'NHIMA-123456'
            }
        ]);

        console.log('💰 Creating Invoices & Payments...');

        // Invoice 1: Cash Payment (Fully Paid)
        const invoice1 = await Invoice.create({
            patientId: patients[0].id,
            status: 'paid',
            totalAmount: 50.00,
            paidAmount: 50.00,
            balance: 0.00,
            paymentMethod: 'cash',
            billDate: new Date(),
            dueDate: new Date(),
            items: [
                { serviceId: opdService.id, quantity: 1, unitPrice: 50.00, totalPrice: 50.00 }
            ]
        }, { include: [InvoiceItem] });

        await Payment.create({
            invoiceId: invoice1.id,
            amount: 50.00,
            paymentMethod: 'cash',
            paymentDate: new Date(),
            reference: 'REC-001',
            receivedBy: adminUser.id
        });

        // Invoice 2: Insurance (Pending)
        await Invoice.create({
            patientId: patients[1].id,
            status: 'pending',
            totalAmount: 130.00, // Consultation (50) + Lab (80)
            paidAmount: 0.00,
            balance: 130.00,
            paymentMethod: 'insurance',
            billDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            items: [
                { serviceId: opdService.id, quantity: 1, unitPrice: 50.00, totalPrice: 50.00 },
                { serviceId: labService.id, quantity: 1, unitPrice: 80.00, totalPrice: 80.00 }
            ]
        }, { include: [InvoiceItem] });

        // Invoice 3: Part Paid Cash
        const invoice3 = await Invoice.create({
            patientId: patients[2].id,
            status: 'partially_paid',
            totalAmount: 200.00,
            paidAmount: 100.00,
            balance: 100.00,
            paymentMethod: 'cash',
            billDate: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
            dueDate: new Date(),
            items: [
                // Simulating a custom service or multiple items
                { serviceId: opdService.id, quantity: 4, unitPrice: 50.00, totalPrice: 200.00 }
            ]
        }, { include: [InvoiceItem] });

        await Payment.create({
            invoiceId: invoice3.id,
            amount: 100.00,
            paymentMethod: 'cash',
            paymentDate: new Date(),
            reference: 'REC-002',
            receivedBy: adminUser.id
        });

        console.log('\n🎉 Demo Data Seeding Completed!');
        console.log('You should now see data in your Dashboard.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Demo seeding failed:', error);
        process.exit(1);
    }
};

seedDemoData();
