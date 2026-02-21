const { checkAndSendReminders } = require('./jobs/debtRemindersJob');
const { sequelize } = require('./models');

const runTest = async () => {
    try {
        await sequelize.authenticate();
        await checkAndSendReminders();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

runTest();
