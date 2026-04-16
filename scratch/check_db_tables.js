require('dotenv').config({ path: '../backend/.env' });
const { sequelize } = require('../backend/config/database');

async function checkTables() {
    try {
        const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = results.map(r => r.table_name);
        console.log('Tables in database:');
        console.log(tables.join(', '));
        
        if (tables.includes('scheme_invoices')) {
            console.log('\n✅ scheme_invoices table exists.');
        } else {
            console.log('\n❌ scheme_invoices table MISSING.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await sequelize.close();
    }
}

checkTables();
