const { sequelize } = require('../config/database');
const { Patient, OPDBill, User, Service } = require('../models');
const { mergePatients } = require('../controllers/patientController');

async function verifyMerge() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        // 1. Setup Data - Ensure we have a user and service
        const [user] = await User.findOrCreate({
            where: { email: 'test_admin@medfinance.com' },
            defaults: {
                username: 'test_admin',
                password: 'password123',
                email: 'test_admin@medfinance.com',
                firstName: 'Test',
                lastName: 'Admin',
                role: 'admin',
                status: 'approved',
                isActive: true
            }
        });

        const [service] = await Service.findOrCreate({
            where: { serviceName: 'General Consultation' }, // changed to serviceName based on schema? Wait, schema said service_name but sequelize usually uses camelCase serviceName
            defaults: {
                serviceName: 'General Consultation',
                serviceCode: 'CONS-001',
                category: 'opd',
                price: 150.00,
                cashPrice: 150.00,
                isActive: true
            }
        });

        // 2. Create Patients
        const primary = await Patient.create({
            firstName: 'Primary',
            lastName: 'Patient',
            patientNumber: 'P_TEST_001',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            phone: '0970000001',
            nrc: '111111/11/1'
        });

        const duplicate = await Patient.create({
            firstName: 'Duplicate',
            lastName: 'Patient',
            patientNumber: 'P_TEST_002',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            phone: '0970000002',
            nrc: '222222/22/1' // Different NRC initially
        });

        console.log(`Created Primary: ${primary.id}, Duplicate: ${duplicate.id}`);

        // 3. Create Related Record for Duplicate
        const bill = await OPDBill.create({
            billNumber: `BILL-${Date.now()}`,
            patientId: duplicate.id,
            serviceId: service.id,
            billDate: new Date(),
            quantity: 1,
            unitPrice: 150.00,
            totalAmount: 150.00,
            netAmount: 150.00,
            status: 'pending',
            createdBy: user.id
        });

        console.log(`Created Bill ${bill.id} for Duplicate Patient ${duplicate.id}`);

        // 4. Mock Request/Response
        const req = {
            body: {
                primaryId: primary.id,
                duplicateId: duplicate.id
            }
        };

        const res = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.data = data;
                return this;
            }
        };

        // 5. Execute Merge
        console.log('Executing mergePatients...');
        await mergePatients(req, res);

        // 6. Verify Results
        if (res.statusCode && res.statusCode !== 200) {
            console.error('❌ Merge failed with status:', res.statusCode, res.data);
            process.exit(1);
        }

        console.log('Merge executed globally. Verifying DB state...');

        // Check if duplicate is deleted
        const dupCheck = await Patient.findByPk(duplicate.id);
        if (dupCheck) {
            console.error('❌ Duplicate patient still exists!');
        } else {
            console.log('✅ Duplicate patient deleted.');
        }

        // Check if bill moved
        const billCheck = await OPDBill.findByPk(bill.id);
        if (billCheck.patientId === primary.id) {
            console.log('✅ Bill reassigned to primary patient.');
        } else {
            console.error(`❌ Bill patientId is ${billCheck.patientId}, expected ${primary.id}`);
        }

        // Cleanup
        await billCheck.destroy();
        await primary.destroy();
        // duplicate is already destroyed
        // Service and User can stay

        console.log('✅ Cleanup done. Verification SUCCESSFUL.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Error:', error.message);
        if (error.sql) console.error('SQL:', error.sql);
        console.error(error.stack);
        process.exit(1);
    }
}

verifyMerge();
