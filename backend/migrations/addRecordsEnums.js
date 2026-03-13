const { sequelize } = require('../config/database');

const runMigration = async () => {
    try {
        console.log('⏳ Running Records ENUM migration...');

        // Add 'records_clerk' to user role enum
        await sequelize.query(
            `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'records_clerk'`
        );

        // Add extra queue statuses to visit queue_status enum
        const newQueueStatuses = ['waiting_theatre', 'waiting_lab', 'waiting_radiology', 'waiting_specialist'];
        for (const val of newQueueStatuses) {
            await sequelize.query(
                `ALTER TYPE "enum_visits_queue_status" ADD VALUE IF NOT EXISTS '${val}'`
            );
        }

        console.log('✅ Records ENUM migration completed successfully.');
    } catch (error) {
        console.error('⚠️  Records ENUM migration error (non-fatal):', error.message);
    }
};

module.exports = runMigration;
