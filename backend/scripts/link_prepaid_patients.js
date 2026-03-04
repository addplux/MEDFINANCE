/**
 * Migration Script: Link all private_prepaid patients to a "Private Prepaid Scheme"
 *
 * Run with: node scripts/link_prepaid_patients.js
 */

const { sequelize } = require('../config/database');
const { Scheme, Patient } = require('../models');

async function main() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        // 1. Find or create the Private Prepaid scheme
        const [scheme, created] = await Scheme.findOrCreate({
            where: { schemeCode: 'PRV-PREPAID' },
            defaults: {
                schemeCode: 'PRV-PREPAID',
                schemeName: 'Private Prepaid Scheme',
                schemeType: 'other',
                billingCycle: 'monthly',
                pricingModel: 'standard',
                discountRate: 0.00,
                creditLimit: 0.00,
                outstandingBalance: 0.00,
                status: 'active',
                notes: 'Auto-created scheme for private prepaid patients. Covers patients who pay upfront privately.',
                paymentTermsDays: 0,
                gracePeriodDays: 0,
            }
        });

        if (created) {
            console.log(`✅ Created new scheme: "${scheme.schemeName}" (ID: ${scheme.id})`);
        } else {
            console.log(`ℹ️  Scheme already exists: "${scheme.schemeName}" (ID: ${scheme.id})`);
        }

        // 2. Find all private_prepaid patients with no schemeId
        const unlinkedCount = await Patient.count({
            where: {
                paymentMethod: 'private_prepaid',
                schemeId: null,
            }
        });

        console.log(`\n🔍 Found ${unlinkedCount} private_prepaid patient(s) with no scheme linked.`);

        if (unlinkedCount === 0) {
            console.log('✅ All private_prepaid patients are already linked. Nothing to do.');
            process.exit(0);
        }

        // 3. Bulk update: link them all to the scheme
        const [updated] = await Patient.update(
            { schemeId: scheme.id },
            {
                where: {
                    paymentMethod: 'private_prepaid',
                    schemeId: null,
                }
            }
        );

        console.log(`✅ Successfully linked ${updated} patient(s) to "${scheme.schemeName}".`);

        // 4. Summary
        const totalLinked = await Patient.count({
            where: {
                paymentMethod: 'private_prepaid',
                schemeId: scheme.id,
            }
        });
        console.log(`\n📊 Total private_prepaid patients now linked to scheme: ${totalLinked}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

main();
