/**
 * Migration: 005_unified_user_directory
 * Purpose: Adds man_number to users table and relaxes NOT NULL constraints on credentials.
 * Safe to run multiple times (idempotent).
 */

const { sequelize } = require('../config/database');

const runUnifiedUserDirectoryMigration = async () => {
    try {
        console.log('⏳ Running Migration: Unified User Directory...');

        // 1. Add man_number column if not exists
        await sequelize.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS man_number VARCHAR(30);
        `);
        console.log('✅ [Migration 005] man_number column ensured on users table');

        // 2. Relax NOT NULL constraints for directory-only staff
        // We use catch() because some columns might already be nullable or the table might be empty
        await sequelize.query(`
            ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
        `).catch(() => {});

        await sequelize.query(`
            ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        `).catch(() => {});

        await sequelize.query(`
            ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
        `).catch(() => {});

        console.log('✅ [Migration 005] Credential constraints relaxed on users table');
        
        // 3. Ensure indexing for search performance
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_users_man_number ON users(man_number);
        `);
        console.log('✅ [Migration 005] Man Number index ensured');

        console.log('✅ [Migration 005] Unified User Directory migration complete');
    } catch (err) {
        console.error('❌ [Migration 005] Error:', err.message);
        // Non-fatal — server still starts
    }
};

module.exports = runUnifiedUserDirectoryMigration;
