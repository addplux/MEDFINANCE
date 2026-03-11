const { sequelize } = require('./config/database');

async function migrate() {
    try {
        await sequelize.query(
            "ALTER TYPE enum_visits_queue_status ADD VALUE IF NOT EXISTS 'pending_cashier' BEFORE 'waiting_doctor';"
        );
        console.log('✅ ENUM migration done: pending_cashier added to enum_visits_queue_status');
    } catch (e) {
        console.error('Migration error:', e.message);
    } finally {
        await sequelize.close();
    }
}

migrate();
