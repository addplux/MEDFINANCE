/**
 * Migration: 006_add_assigned_doctor_to_visits
 * Purpose: Adds assigned_doctor_id to visits table.
 * Safe to run multiple times (idempotent).
 */

const { sequelize } = require('../config/database');

const runAddAssignedDoctorToVisitsMigration = async () => {
    try {
        await sequelize.query(`
            ALTER TABLE visits ADD COLUMN IF NOT EXISTS assigned_doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('✅ [Migration 006] assigned_doctor_id column ensured on visits table');
    } catch (err) {
        console.error('❌ [Migration 006] Error:', err.message);
    }
};

module.exports = runAddAssignedDoctorToVisitsMigration;
