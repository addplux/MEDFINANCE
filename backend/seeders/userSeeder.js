/**
 * User Seeder — MEDFINANCE360
 * Creates one demo staff user per role with professional hospital credentials.
 * 
 * Run: npm run seed:users
 * 
 * ⚠️  These are demo accounts. Change passwords before going to production!
 */
const bcrypt = require('bcrypt');
const { User, Role, sequelize } = require('../models');

const HOSPITAL_DOMAIN = 'hilltophospital.co.zm';

const demoUsers = [
    {
        firstName: 'Dr. Chilufya',
        lastName: 'Mwape',
        username: 'c.mwape',
        email: `c.mwape@${HOSPITAL_DOMAIN}`,
        password: 'Doctor@2026',
        role: 'superintendent',
        department: 'Executive / Medical Directorate',
    },
    {
        firstName: 'Bwalya',
        lastName: 'Tembo',
        username: 'b.tembo',
        email: `b.tembo@${HOSPITAL_DOMAIN}`,
        password: 'Admin@2026',
        role: 'admin',
        department: 'ICT / Administration',
    },
    {
        firstName: 'Dr. Mutale',
        lastName: 'Phiri',
        username: 'm.phiri',
        email: `m.phiri@${HOSPITAL_DOMAIN}`,
        password: 'Doctor@2026',
        role: 'doctor',
        department: 'General Medicine / OPD',
    },
    {
        firstName: 'Grace',
        lastName: 'Lungu',
        username: 'g.lungu',
        email: `g.lungu@${HOSPITAL_DOMAIN}`,
        password: 'Nurse@2026',
        role: 'nurse',
        department: 'Ward 1 — General',
    },
    {
        firstName: 'Chanda',
        lastName: 'Mulenga',
        username: 'ch.mulenga',
        email: `ch.mulenga@${HOSPITAL_DOMAIN}`,
        password: 'Finance@2026',
        role: 'accountant',
        department: 'Finance & Accounts',
    },
    {
        firstName: 'Naomi',
        lastName: 'Banda',
        username: 'n.banda',
        email: `n.banda@${HOSPITAL_DOMAIN}`,
        password: 'Cashier@2026',
        role: 'cashier',
        department: 'Billing & Cashier',
    },
    {
        firstName: 'Patrick',
        lastName: 'Kabwe',
        username: 'p.kabwe',
        email: `p.kabwe@${HOSPITAL_DOMAIN}`,
        password: 'Pharma@2026',
        role: 'pharmacist',
        department: 'Pharmacy',
    },
    {
        firstName: 'Mercy',
        lastName: 'Zulu',
        username: 'm.zulu',
        email: `m.zulu@${HOSPITAL_DOMAIN}`,
        password: 'Labtech@2026',
        role: 'lab_technician',
        department: 'Laboratory',
    },
    {
        firstName: 'James',
        lastName: 'Nkandu',
        username: 'j.nkandu',
        email: `j.nkandu@${HOSPITAL_DOMAIN}`,
        password: 'Radio@2026',
        role: 'radiographer',
        department: 'Radiology',
    },
];

const seedUsers = async () => {
    try {
        await sequelize.authenticate();
        console.log('\n[UserSeeder] ✅ Connected to database.\n');

        const salt = await bcrypt.genSalt(10);

        let created = 0;
        let skipped = 0;

        for (const userData of demoUsers) {
            const exists = await User.findOne({ where: { email: userData.email } });
            if (exists) {
                console.log(`  ⏭  Skipped (already exists): ${userData.email}`);
                skipped++;
                continue;
            }

            // Find the matching Role record to link roleId
            const roleRecord = await Role.findOne({ where: { name: userData.role } });

            await User.create({
                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
                email: userData.email,
                password: userData.password, // Hooks in User.js will hash this automatically
                role: userData.role,
                roleId: roleRecord?.id || null,
                department: userData.department,
                isActive: true,
                status: 'approved',
            });

            console.log(`  ✅ Created: ${userData.email}  (${userData.role})`);
            created++;
        }

        console.log('\n┌────────────────────────────────────────────────────────────────┐');
        console.log('│              HILLTOP HOSPITAL — DEMO USER CREDENTIALS           │');
        console.log('├──────────────────────────────────┬─────────────┬───────────────┤');
        console.log('│ Email                            │ Role        │ Password      │');
        console.log('├──────────────────────────────────┬─────────────┬───────────────┤');
        demoUsers.forEach(u => {
            const email = u.email.padEnd(34);
            const role = u.role.padEnd(13);
            const pass = u.password.padEnd(13);
            console.log(`│ ${email} │ ${role} │ ${pass} │`);
        });
        console.log('└──────────────────────────────────┴─────────────┴───────────────┘');
        console.log(`\n  Summary — Created: ${created}  |  Skipped: ${skipped}\n`);

        process.exit(0);
    } catch (error) {
        console.error('\n[UserSeeder] ❌ Failed:', error.message);
        process.exit(1);
    }
};

seedUsers();
