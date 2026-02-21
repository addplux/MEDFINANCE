/**
 * MEDFINANCE360 Cron Job Manager
 * Centralizes all background scheduled tasks.
 */

const cron = require('node-cron');
const debtRemindersJob = require('./debtRemindersJob');

const initCronJobs = () => {
    console.log('Initialize Cron Jobs: Scheduling Automated Tasks...');

    // Debt Reminders Job
    // Runs every day at 08:00 AM (server time)
    // For manual testing, you can change this to '* * * * *' (every minute)
    cron.schedule('0 8 * * *', () => {
        debtRemindersJob.checkAndSendReminders();
    }, {
        scheduled: true,
        timezone: "Africa/Lusaka"
    });

    // You can register other jobs here
};

module.exports = {
    initCronJobs
};
