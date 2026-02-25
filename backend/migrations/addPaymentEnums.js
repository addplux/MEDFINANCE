/**
 * Migration: Add insurance to paymentMethod ENUM and extend billType ENUM
 * Run once at server startup - safe to re-run (uses IF NOT EXISTS checks)
 */
const { sequelize } = require('../config/database');

const runMigration = async () => {
    try {
        // Add 'insurance' to enum_payments_payment_method if not already present
        await sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum
                    WHERE enumlabel = 'insurance'
                    AND enumtypid = (
                        SELECT oid FROM pg_type WHERE typname = 'enum_payments_payment_method'
                    )
                ) THEN
                    ALTER TYPE "enum_payments_payment_method" ADD VALUE 'insurance';
                END IF;
            END$$;
        `);

        const newBillTypes = ['theatre', 'maternity', 'specialist', 'multiple'];
        for (const val of newBillTypes) {
            await sequelize.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_enum
                        WHERE enumlabel = '${val}'
                        AND enumtypid = (
                            SELECT oid FROM pg_type WHERE typname = 'enum_payments_bill_type'
                        )
                    ) THEN
                        ALTER TYPE "enum_payments_bill_type" ADD VALUE '${val}';
                    END IF;
                END$$;
            `);
        }

        console.log('✅ Payment ENUM migration completed successfully.');
    } catch (error) {
        console.error('⚠️  Payment ENUM migration error (non-fatal):', error.message);
    }
};

module.exports = runMigration;
