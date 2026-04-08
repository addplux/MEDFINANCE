/**
 * Migration: 003_smartcare_integration
 * Purpose: Adds man_number to patients table and pending_authorization to visit queue status.
 * Safe to run multiple times (idempotent).
 */

const { sequelize } = require('../config/database');

const runSmartCareIntegrationMigration = async () => {
    try {
        // 1. Add man_number column if not exists
        await sequelize.query(`
            ALTER TABLE patients ADD COLUMN IF NOT EXISTS man_number VARCHAR(30);
        `);
        console.log('✅ [Migration 003] man_number column ensured on patients table');

        // 2. Add referral_type column (bypass / referral) if not exists
        await sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'enum_patients_referral_type'
                ) THEN
                    CREATE TYPE enum_patients_referral_type AS ENUM ('bypass', 'referral');
                END IF;
            END$$;
        `);

        await sequelize.query(`
            ALTER TABLE patients ADD COLUMN IF NOT EXISTS referral_type enum_patients_referral_type DEFAULT 'bypass';
        `);
        console.log('✅ [Migration 003] referral_type column ensured on patients table');

        // 3. Add pending_authorization to visits queue_status enum
        await sequelize.query(`
            ALTER TYPE enum_visits_queue_status ADD VALUE IF NOT EXISTS 'pending_authorization';
        `);
        console.log('✅ [Migration 003] pending_authorization added to enum_visits_queue_status');

        // 4. Relax NOT NULL on demographic columns owned by SmartCare
        await sequelize.query(`
            ALTER TABLE patients ALTER COLUMN gender DROP NOT NULL;
        `).catch(() => {}); // May already be nullable

        console.log('✅ [Migration 003] SmartCare integration migration complete');
    } catch (err) {
        console.error('❌ [Migration 003] Error:', err.message);
        // Non-fatal — server still starts
    }
};

module.exports = runSmartCareIntegrationMigration;
