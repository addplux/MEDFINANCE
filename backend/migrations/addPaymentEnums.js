/**
 * Migration: Add insurance to paymentMethod ENUM and extend billType ENUM
 * Uses ALTER TYPE ... ADD VALUE IF NOT EXISTS (PostgreSQL 9.6+)
 * NOTE: ALTER TYPE ADD VALUE cannot run inside a PL/pgSQL DO block (transaction).
 *       Must be run as direct queries outside any transaction.
 */
const { sequelize } = require('../config/database');

const runMigration = async () => {
    try {
        // Add 'insurance' to paymentMethod enum
        await sequelize.query(
            `ALTER TYPE "enum_payments_payment_method" ADD VALUE IF NOT EXISTS 'insurance'`
        );

        // Add new billType enum values
        const newBillTypes = ['theatre', 'maternity', 'specialist', 'multiple'];
        for (const val of newBillTypes) {
            await sequelize.query(
                `ALTER TYPE "enum_payments_bill_type" ADD VALUE IF NOT EXISTS '${val}'`
            );
        }

        console.log('✅ Payment ENUM migration completed successfully.');
    } catch (error) {
        console.error('⚠️  Payment ENUM migration error (non-fatal):', error.message);
    }
};

module.exports = runMigration;
