require('dotenv').config({ path: __dirname + '/.env' });
const { sequelize } = require('./models');

async function run() {
    try {
        console.log('Running ALTER TABLE...');
        await sequelize.query('ALTER TABLE visits ADD COLUMN "assigned_doctor_id" INTEGER REFERENCES users(id);');
        console.log("Migration successful");
    } catch(e) {
        if (e.message.includes('already exists')) {
            console.log('Column already exists!');
        } else {
            console.error('Error:', e.message);
        }
    }
    process.exit();
}
run();
