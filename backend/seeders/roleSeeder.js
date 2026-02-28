/**
 * Role Seeder — MEDFINANCE360
 * Seeds the 9 hospital roles with their full JSONB permission sets.
 * 
 * Run: npm run seed:roles
 */
const { Role, sequelize } = require('../models');

const roles = [
    {
        name: 'superintendent',
        description: 'Medical Director / Superintendent — Full system access including finance, clinical, and system administration.',
        isSystem: true,
        permissions: { '*': ['manage'] }
    },
    {
        name: 'admin',
        description: 'System Administrator — Manages users, roles, departments, settings, and audit logs. No direct clinical access.',
        isSystem: true,
        permissions: {
            dashboard: ['manage'],
            patients: ['manage'],
            visits: ['manage'],
            billing_opd: ['manage'],
            receivables: ['read'],
            schemes: ['read'],
            reports: ['read'],
            setup: ['manage'],
            audit_logs: ['manage'],
        }
    },
    {
        name: 'doctor',
        description: 'Medical Officer / Doctor — Full clinical access including OPD billing, lab/radiology requests, theatre, maternity, and specialist clinics.',
        isSystem: true,
        permissions: {
            dashboard: ['read'],
            patients: ['manage'],
            visits: ['manage'],
            billing_opd: ['read'],
            laboratory: ['manage'],
            radiology: ['manage'],
            theatre: ['manage'],
            maternity: ['manage'],
            specialist_clinics: ['manage'],
            pharmacy: ['read'],
            reports: ['read'],
        }
    },
    {
        name: 'nurse',
        description: 'Nurse / Ward Staff — Clinical patient access for OPD, visits, maternity, and theatre. Cannot access finance modules.',
        isSystem: true,
        permissions: {
            dashboard: ['read'],
            patients: ['write'],
            visits: ['manage'],
            billing_opd: ['read'],
            laboratory: ['read'],
            radiology: ['read'],
            theatre: ['write'],
            maternity: ['manage'],
            specialist_clinics: ['read'],
            pharmacy: ['read'],
        }
    },
    {
        name: 'accountant',
        description: 'Chief Accountant / Finance Officer — Full access to all financial modules: GL, payables, receivables, budgets, funds, payroll, and reports.',
        isSystem: true,
        permissions: {
            dashboard: ['read'],
            patients: ['read'],
            billing_opd: ['manage'],
            cash_payments: ['manage'],
            ledger: ['manage'],
            payables: ['manage'],
            receivables: ['manage'],
            schemes: ['manage'],
            budgets: ['manage'],
            funds: ['manage'],
            payroll: ['manage'],
            reports: ['manage'],
        }
    },
    {
        name: 'cashier',
        description: 'Cashier / Billing Clerk — Processes cash payments, creates OPD bills, issues receipts, and manages shift reports.',
        isSystem: true,
        permissions: {
            dashboard: ['read'],
            patients: ['write'],
            billing_opd: ['write'],
            cash_payments: ['manage'],
            receivables: ['read'],
            schemes: ['read'],
            reports: ['read'],
        }
    },
    {
        name: 'pharmacist',
        description: 'Pharmacist / Dispenser — Manages pharmacy inventory, Goods Received Notes, and drug dispensing.',
        isSystem: true,
        permissions: {
            dashboard: ['read'],
            patients: ['read'],
            visits: ['read'],
            pharmacy: ['manage'],
        }
    },
    {
        name: 'lab_technician',
        description: 'Laboratory Technician — Processes lab test requests and enters test results.',
        isSystem: true,
        permissions: {
            dashboard: ['read'],
            patients: ['read'],
            visits: ['read'],
            laboratory: ['manage'],
        }
    },
    {
        name: 'radiographer',
        description: 'Radiographer — Processes radiology scan requests and records imaging results.',
        isSystem: true,
        permissions: {
            dashboard: ['read'],
            patients: ['read'],
            visits: ['read'],
            radiology: ['manage'],
        }
    },
];

const seedRoles = async () => {
    try {
        await sequelize.authenticate();
        console.log('[RoleSeeder] Database connection established.');

        let created = 0;
        let updated = 0;

        for (const roleData of roles) {
            const [role, wasCreated] = await Role.findOrCreate({
                where: { name: roleData.name },
                defaults: roleData,
            });

            if (!wasCreated) {
                await role.update({
                    description: roleData.description,
                    permissions: roleData.permissions,
                    isSystem: roleData.isSystem,
                });
                updated++;
            } else {
                created++;
            }
        }

        console.log(`[RoleSeeder] ✅ Done. Created: ${created}, Updated: ${updated} roles.`);
        console.table(roles.map(r => ({ name: r.name, description: r.description.substring(0, 60) + '...' })));
        process.exit(0);
    } catch (error) {
        console.error('[RoleSeeder] ❌ Failed:', error.message);
        process.exit(1);
    }
};

seedRoles();
