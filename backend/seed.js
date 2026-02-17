require('dotenv').config();
const { syncDatabase, User, Role, Department, Service, ChartOfAccounts } = require('./models');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Sync database (create tables)
        await syncDatabase({ force: true }); // WARNING: This will drop all tables!

        console.log('📊 Creating initial data...');

        // 0. Create Roles
        const adminRole = await Role.create({
            name: 'Administrator',
            description: 'Full system access',
            permissions: { all: ['manage'] },
            isSystem: true
        });

        const accountantRole = await Role.create({
            name: 'Accountant',
            description: 'Financial management access',
            permissions: { finance: ['read', 'write'], reports: ['read'] },
            isSystem: true
        });

        const billingRole = await Role.create({
            name: 'Billing Staff',
            description: 'Billing and patient management',
            permissions: { billing: ['read', 'write'], patients: ['read', 'write'] },
            isSystem: true
        });

        const viewerRole = await Role.create({
            name: 'Viewer',
            description: 'Read-only access',
            permissions: { '*': ['read'] },
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
            isActive: true
        });
        console.log('✅ Admin user created');

        // 2. Create sample users
        await User.bulkCreate([
            {
                username: 'accountant1',
                email: 'accountant@medfinance360.com',
                password: 'Account@123',
                role: 'accountant',
                firstName: 'John',
                lastName: 'Mwansa',
                roleId: accountantRole.id,
                isActive: true
            },
            {
                username: 'billing1',
                email: 'billing@medfinance360.com',
                password: 'Billing@123',
                role: 'billing_staff',
                firstName: 'Mary',
                lastName: 'Banda',
                roleId: billingRole.id,
                isActive: true
            }
        ], { individualHooks: true });
        console.log('✅ Sample users created');

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
