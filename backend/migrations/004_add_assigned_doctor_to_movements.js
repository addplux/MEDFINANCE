/**
 * Migration: 004_add_assigned_doctor_to_movements
 * Purpose: Adds assigned_doctor_id to patient_movements table.
 * Safe to run multiple times (idempotent).
 */

const { sequelize } = require('../config/database');

const runAddAssignedDoctorToMovementsMigration = async () => {
    try {
        await sequelize.query(`
            ALTER TABLE patient_movements ADD COLUMN IF NOT EXISTS assigned_doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('✅ [Migration 004] assigned_doctor_id column ensured on patient_movements table');
    } catch (err) {
        console.error('❌ [Migration 004] Error:', err.message);
    }
};

module.exports = runAddAssignedDoctorToMovementsMigration;
