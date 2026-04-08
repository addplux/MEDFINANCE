require('dotenv').config();
const { User } = require('./models');

async function diagnoseAdmin() {
    try {
        // 1. Find admin by email
        const admin = await User.findOne({ where: { email: 'admin@medfinance360.com' } });

        if (!admin) {
            console.log('❌ No user found with email: admin@medfinance360.com');
            console.log('\nAll users in the database:');
            const all = await User.findAll({ attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'isActive'] });
            console.table(all.map(u => u.toJSON()));
            return;
        }

        console.log('✅ Admin user FOUND:');
        console.log({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            status: admin.status,
            isActive: admin.isActive,
            firstName: admin.firstName,
            lastName: admin.lastName,
            hasPassword: !!admin.password,
            passwordLength: admin.password?.length
        });

        // 2. Check likely passwords
        const testPasswords = ['Admin123!', 'admin123', 'Admin@123', 'password', 'Password123!', 'medfinance360', 'Admin1234', 'admin'];
        console.log('\n🔑 Testing common passwords:');
        for (const pw of testPasswords) {
            try {
                const match = await admin.comparePassword(pw);
                if (match) {
                    console.log(`✅ PASSWORD MATCH: "${pw}"`);
                } else {
                    console.log(`❌ No match: "${pw}"`);
                }
            } catch (e) {
                console.log(`⚠️  Error testing "${pw}": ${e.message}`);
            }
        }

        // 3. Check blocking conditions
        console.log('\n🔍 Login blockers:');
        if (admin.status === 'pending')   console.log('❌ BLOCKED: status is "pending"');
        if (admin.status === 'rejected')  console.log('❌ BLOCKED: status is "rejected"');
        if (!admin.isActive)              console.log('❌ BLOCKED: isActive is false');
        if (admin.status === 'approved' && admin.isActive) console.log('✅ Status and isActive are fine');

    } catch (error) {
        console.error('Error during diagnosis:', error);
    } finally {
        process.exit();
    }
}

diagnoseAdmin();
