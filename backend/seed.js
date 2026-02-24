require('dotenv').config();
const { syncDatabase, User, Role, Department, Service, ChartOfAccounts, Scheme, CorporateAccount, Patient, Medication, PharmacyBatch, LabTest, Organization } = require('./models');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Sync database (create tables)
        await syncDatabase({ force: true }); // WARNING: This will drop all tables!

        console.log('📊 Creating initial data...');

        // 0. Create Roles
        const doctorRole = await Role.create({
            name: 'Doctor',
            description: 'Clinical and consultation access',
            permissions: { clinical: ['read', 'write'], patients: ['read', 'write'] },
            isSystem: true
        });

        const nurseRole = await Role.create({
            name: 'Nurse',
            description: 'Ward and nursing care access',
            permissions: { clinical: ['read', 'write'], patients: ['read'] },
            isSystem: true
        });

        const pharmacistRole = await Role.create({
            name: 'Pharmacist',
            description: 'Pharmacy inventory and dispensing access',
            permissions: { pharmacy: ['read', 'write'], inventory: ['read', 'write'] },
            isSystem: true
        });

        const labTechRole = await Role.create({
            name: 'Lab Technician',
            description: 'Laboratory testing and results access',
            permissions: { laboratory: ['read', 'write'] },
            isSystem: true
        });
        const adminRole = await Role.create({
            name: 'Admin',
            description: 'Full system access',
            permissions: { all: ['read', 'write', 'delete'] },
            isSystem: true
        });

        const accountantRole = await Role.create({
            name: 'Accountant',
            description: 'Financial and reporting access',
            permissions: { finance: ['read', 'write'], reports: ['read'] },
            isSystem: true
        });

        const billingRole = await Role.create({
            name: 'Billing Staff',
            description: 'Billing and invoicing access',
            permissions: { billing: ['read', 'write'], patients: ['read'] },
            isSystem: true
        });

        console.log('✅ Default roles created');

        // 1. Create Admin User
        const adminUser = await User.create({
            username: 'admin',
            email: 'admin@medfinance360.com',
            password: 'Admin@123',
            role: 'admin',
            firstName: 'System',
            lastName: 'Administrator',
            roleId: adminRole.id,
            isActive: true,
            status: 'approved'
        });
        console.log('✅ Admin user created');

        // 2. Create sample users (Staff)
        const staff = await User.bulkCreate([
            {
                username: 'accountant1',
                email: 'accountant@medfinance360.com',
                password: 'Account@123',
                role: 'accountant',
                firstName: 'John',
                lastName: 'Mwansa',
                roleId: accountantRole.id,
                isActive: true,
                status: 'approved'
            },
            {
                username: 'billing1',
                email: 'billing@medfinance360.com',
                password: 'Billing@123',
                role: 'billing_staff',
                firstName: 'Mary',
                lastName: 'Banda',
                roleId: billingRole.id,
                isActive: true,
                status: 'approved'
            },
            {
                username: 'drchanda',
                email: 'dr.chanda@medfinance360.com',
                password: 'Doctor@123',
                role: 'doctor',
                firstName: 'Emmanuel',
                lastName: 'Chanda',
                roleId: doctorRole.id,
                isActive: true,
                status: 'approved'
            },
            {
                username: 'nursemulenga',
                email: 'nurse.mulenga@medfinance360.com',
                password: 'Nurse@123',
                role: 'nurse',
                firstName: 'Sarah',
                lastName: 'Mulenga',
                roleId: nurseRole.id,
                isActive: true,
                status: 'approved'
            },
            {
                username: 'pharmbwalya',
                email: 'pharm.bwalya@medfinance360.com',
                password: 'Pharm@123',
                role: 'pharmacist',
                firstName: 'David',
                lastName: 'Bwalya',
                roleId: pharmacistRole.id,
                isActive: true,
                status: 'approved'
            },
            {
                username: 'labbvumbo',
                email: 'lab.bvumbo@medfinance360.com',
                password: 'Lab@123',
                role: 'lab_technician',
                firstName: 'Peter',
                lastName: 'Bvumbo',
                roleId: labTechRole.id,
                isActive: true,
                status: 'approved'
            }
        ], { individualHooks: true });
        console.log('✅ Sample staff users created');

        const drChandaId = staff.find(s => s.username === 'drchanda').id;

        // 3. Create Departments
        const departments = await Department.bulkCreate([
            { departmentCode: 'OPD', departmentName: 'Outpatient Department', managerId: adminUser.id, status: 'active' },
            { departmentCode: 'IPD', departmentName: 'Inpatient Department', managerId: adminUser.id, status: 'active' },
            { departmentCode: 'PHARM', departmentName: 'Pharmacy', managerId: adminUser.id, status: 'active' },
            { departmentCode: 'LAB', departmentName: 'Laboratory', managerId: adminUser.id, status: 'active' },
            { departmentCode: 'RAD', departmentName: 'Radiology', managerId: adminUser.id, status: 'active' },
            { departmentCode: 'ADMIN', departmentName: 'Administration', managerId: adminUser.id, status: 'active' },
            { departmentCode: 'FIN', departmentName: 'Finance', managerId: adminUser.id, status: 'active' }
        ]);
        console.log('✅ Departments created');

        // 4. Create Schemes & Corporate Accounts
        const madisonScheme = await Scheme.create({
            schemeCode: 'MAD01',
            schemeName: 'Madison Health Insurance',
            schemeType: 'insurance',
            billingCycle: 'monthly',
            pricingModel: 'tiered',
            status: 'active'
        });

        // Create a Corporate Scheme (linked to Zambia Sugar corporate account)
        const corporateScheme = await Scheme.create({
            schemeCode: 'CORP01',
            schemeName: 'Zambia Sugar Corporate',
            schemeType: 'corporate',
            billingCycle: 'monthly',
            pricingModel: 'standard',
            status: 'active',
            contactPerson: 'HR Manager',
            phone: '0211123456',
            email: 'hr@zambiasugar.com'
        });

        const zamSugarCorp = await CorporateAccount.create({
            accountNumber: 'CORP-ZSUG',
            companyName: 'Zambia Sugar Plc',
            contactPerson: 'HR Manager',
            phone: '0211123456',
            email: 'hr@zambiasugar.com',
            creditLimit: 50000.00,
            status: 'active'
        });
        console.log('✅ Schemes and Corporate accounts created');

        // 5. Create Patients
        await Patient.bulkCreate([
            {
                patientNumber: 'PT-000001',
                firstName: 'James',
                lastName: 'Phiri',
                dateOfBirth: '1985-06-15',
                gender: 'male',
                phone: '0977112233',
                patientType: 'opd',
                paymentMethod: 'cash',
                costCategory: 'standard',
                balance: 0.00
            },
            {
                patientNumber: 'PT-000003',
                firstName: 'Chisomo',
                lastName: 'Banda',
                dateOfBirth: '1978-03-10',
                gender: 'male',
                phone: '0955778899',
                patientType: 'ipd',
                paymentMethod: 'scheme',
                schemeId: madisonScheme.id,
                policyNumber: 'MAD-HLT-001',
                ward: 'general_ward',
                staffId: drChandaId,
                costCategory: 'high_cost',
                balance: 0.00
            },
            {
                patientNumber: 'PT-000004',
                firstName: 'Bupe',
                lastName: 'Mwewa',
                dateOfBirth: '1995-08-05',
                gender: 'female',
                phone: '0977998877',
                patientType: 'opd',
                paymentMethod: 'corporate',
                policyNumber: zamSugarCorp.accountNumber,
                costCategory: 'standard',
                balance: 0.00
            }
        ]);
        console.log('✅ Test Patients created');

        // 6. Create Pharmacy Inventory
        const panadol = await Medication.create({
            code: 'DRUG-001',
            name: 'Paracetamol (Panadol) 500mg',
            category: 'Tablet',
            unitOfMeasure: 'blister',
            manufacturer: 'GSK',
            isActive: true
        });

        const amox = await Medication.create({
            code: 'DRUG-002',
            name: 'Amoxicillin 250mg',
            category: 'Capsule',
            unitOfMeasure: 'box',
            manufacturer: 'PharmaCorp',
            isActive: true
        });

        const ivFluid = await Medication.create({
            code: 'CONS-001',
            name: 'Normal Saline IV Fluid 500ml',
            category: 'Consumable',
            unitOfMeasure: 'bag',
            manufacturer: 'MedSupply',
            isActive: true
        });

        await PharmacyBatch.bulkCreate([
            {
                medicationId: panadol.id,
                batchNumber: 'B-PANA-2026',
                expiryDate: '2028-12-31',
                quantityReceived: 1000,
                quantityOnHand: 1000,
                unitCost: 2.50,
                sellingPrice: 10.00
            },
            {
                medicationId: amox.id,
                batchNumber: 'B-AMOX-2026',
                expiryDate: '2027-06-30',
                quantityReceived: 500,
                quantityOnHand: 500,
                unitCost: 15.00,
                sellingPrice: 45.00
            },
            {
                medicationId: ivFluid.id,
                batchNumber: 'B-IVF-2026',
                expiryDate: '2029-01-01',
                quantityReceived: 200,
                quantityOnHand: 200,
                unitCost: 50.00,
                sellingPrice: 150.00
            }
        ]);
        console.log('✅ Pharmacy Medications and Batches created');

        // 7. Create Lab Tests
        await LabTest.bulkCreate([
            { code: 'LT-001', name: 'Full Blood Count (FBC)', category: 'Hematology', price: 150.00, isActive: true },
            { code: 'LT-002', name: 'Malaria RDT', category: 'Microbiology', price: 50.00, isActive: true },
            { code: 'LT-003', name: 'Urinalysis', category: 'Biochemistry', price: 80.00, isActive: true },
            { code: 'LT-004', name: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 250.00, isActive: true }
        ]);
        console.log('✅ Laboratory Tests created');


        // 4. Create Services
        await Service.bulkCreate([
            // OPD Services
            { serviceCode: 'OPD001', serviceName: 'General Consultation', category: 'opd', department: 'OPD', price: 50.00, isActive: true },
            { serviceCode: 'OPD002', serviceName: 'Specialist Consultation', category: 'opd', department: 'OPD', price: 150.00, isActive: true },
            { serviceCode: 'OPD003', serviceName: 'Follow-up Visit', category: 'opd', department: 'OPD', price: 30.00, isActive: true },

            // Laboratory Services
            { serviceCode: 'LAB001', serviceName: 'Complete Blood Count', category: 'laboratory', department: 'LAB', price: 80.00, isActive: true },
            { serviceCode: 'LAB002', serviceName: 'Malaria Test', category: 'laboratory', department: 'LAB', price: 40.00, isActive: true },
            { serviceCode: 'LAB003', serviceName: 'Blood Sugar Test', category: 'laboratory', department: 'LAB', price: 35.00, isActive: true },

            // Radiology Services
            { serviceCode: 'RAD001', serviceName: 'X-Ray Chest', category: 'radiology', department: 'RAD', price: 120.00, isActive: true },
            { serviceCode: 'RAD002', serviceName: 'Ultrasound', category: 'radiology', department: 'RAD', price: 200.00, isActive: true },
            { serviceCode: 'RAD003', serviceName: 'CT Scan', category: 'radiology', department: 'RAD', price: 500.00, isActive: true }
        ]);
        console.log('✅ Services created');

        // 5. Create Chart of Accounts
        // Assets
        const cashAccount = await ChartOfAccounts.create({
            accountCode: '1000',
            accountName: 'Cash',
            accountType: 'asset',
            balance: 0.00,
            isActive: true
        });

        const bankAccount = await ChartOfAccounts.create({
            accountCode: '1100',
            accountName: 'Bank Account',
            accountType: 'asset',
            balance: 0.00,
            isActive: true
        });

        const accountsReceivable = await ChartOfAccounts.create({
            accountCode: '1200',
            accountName: 'Accounts Receivable',
            accountType: 'asset',
            balance: 0.00,
            isActive: true
        });

        // Liabilities
        const accountsPayable = await ChartOfAccounts.create({
            accountCode: '2000',
            accountName: 'Accounts Payable',
            accountType: 'liability',
            balance: 0.00,
            isActive: true
        });

        // Equity
        const capital = await ChartOfAccounts.create({
            accountCode: '3000',
            accountName: 'Capital',
            accountType: 'equity',
            balance: 0.00,
            isActive: true
        });

        // Revenue
        const opdRevenue = await ChartOfAccounts.create({
            accountCode: '4000',
            accountName: 'OPD Revenue',
            accountType: 'revenue',
            balance: 0.00,
            isActive: true
        });

        const ipdRevenue = await ChartOfAccounts.create({
            accountCode: '4100',
            accountName: 'IPD Revenue',
            accountType: 'revenue',
            balance: 0.00,
            isActive: true
        });

        const pharmacyRevenue = await ChartOfAccounts.create({
            accountCode: '4200',
            accountName: 'Pharmacy Revenue',
            accountType: 'revenue',
            balance: 0.00,
            isActive: true
        });

        // Expenses
        const salariesExpense = await ChartOfAccounts.create({
            accountCode: '5000',
            accountName: 'Salaries and Wages',
            accountType: 'expense',
            balance: 0.00,
            isActive: true
        });

        const suppliesExpense = await ChartOfAccounts.create({
            accountCode: '5100',
            accountName: 'Medical Supplies',
            accountType: 'expense',
            balance: 0.00,
            isActive: true
        });

        // 6. Create Organization Info
        await Organization.create({
            name: 'MEDFINANCE360',
            type: 'Government',
            logo: '/logo.png'
        });
        console.log('✅ Organization record created');

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 Login Credentials:');
        console.log('Admin: admin@medfinance360.com / Admin@123');
        console.log('Accountant: accountant@medfinance360.com / Account@123');
        console.log('Billing Staff: billing@medfinance360.com / Billing@123');

        return true;
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

// Export for use in server.js
module.exports = { seedDatabase };

// Run directly if called from command line
if (require.main === module) {
    seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
