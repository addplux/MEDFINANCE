require('dotenv').config();
const { syncDatabase } = require('./models');

async function sync() {
    try {
        console.log('Syncing database with alter: true to create OnlineTransaction table...');
        await syncDatabase({ alter: true });
        console.log('Sync complete.');
    } catch (err) {
        console.error('Error syncing:', err);
    } finally {
        process.exit(0);
    }
}

sync();
