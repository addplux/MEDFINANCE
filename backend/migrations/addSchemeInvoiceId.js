const { sequelize } = require('../config/database');

/**
 * Migration: Add scheme_invoice_id to all billing tables
 * This column allows grouping bills into invoices for schemes/corporates.
 */
const runAddSchemeInvoiceId = async () => {
    const queryInterface = sequelize.getQueryInterface();
    const tables = [
        'opd_bills',
        'pharmacy_bills',
        'radiology_bills',
        'lab_bills',
        'theatre_bills',
        'maternity_bills',
        'specialist_clinic_bills',
        'ipd_bills'
    ];

    console.log('⏳ Running Migration: Add scheme_invoice_id to billing tables...');

    for (const table of tables) {
        try {
            // Check if column exists first
            const [results] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${table}' AND column_name = 'scheme_invoice_id'
            `);

            if (results.length === 0) {
                console.log(`- Adding scheme_invoice_id to ${table}...`);
                await queryInterface.addColumn(table, 'scheme_invoice_id', {
                    type: require('sequelize').DataTypes.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'scheme_invoices',
                        key: 'id'
                    },
                    onDelete: 'SET NULL',
                    onUpdate: 'CASCADE'
                });
                console.log(`  ✅ Added to ${table}`);
            } else {
                console.log(`- ${table} already has scheme_invoice_id column.`);
            }
        } catch (error) {
            console.error(`  ❌ Failed to update ${table}:`, error.message);
        }
    }

    console.log('✅ Migration: scheme_invoice_id check complete.');
};

module.exports = runAddSchemeInvoiceId;
