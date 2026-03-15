const { sequelize } = require('../config/database');

const runMigration = async () => {
    try {
        console.log('⏳ Running Notification ENUM migration...');

        await sequelize.query(
            `ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'wait_time_alert'`
        );

        console.log('✅ Notification ENUM migration completed successfully.');
    } catch (error) {
        console.error('⚠️  Notification ENUM migration error (non-fatal):', error.message);
    }
};

module.exports = runMigration;
