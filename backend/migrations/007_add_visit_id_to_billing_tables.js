/**
 * Migration: 007_add_visit_id_to_billing_tables
 * Purpose: Adds visit_id to lab_bills, pharmacy_bills, and radiology_bills tables.
 * Safe to run multiple times (idempotent).
 */

const { sequelize } = require('../config/database');

const runAddVisitIdToBillingTablesMigration = async () => {
    try {
        await sequelize.query(`
            ALTER TABLE lab_bills ADD COLUMN IF NOT EXISTS visit_id INTEGER REFERENCES visits(id) ON DELETE SET NULL;
        `);
        console.log('✅ [Migration 007] visit_id column ensured on lab_bills table');

        await sequelize.query(`
            ALTER TABLE pharmacy_bills ADD COLUMN IF NOT EXISTS visit_id INTEGER REFERENCES visits(id) ON DELETE SET NULL;
        `);
        console.log('✅ [Migration 007] visit_id column ensured on pharmacy_bills table');

        await sequelize.query(`
            ALTER TABLE radiology_bills ADD COLUMN IF NOT EXISTS visit_id INTEGER REFERENCES visits(id) ON DELETE SET NULL;
        `);
        console.log('✅ [Migration 007] visit_id column ensured on radiology_bills table');

    } catch (err) {
        console.error('❌ [Migration 007] Error:', err.message);
    }
};

module.exports = runAddVisitIdToBillingTablesMigration;
