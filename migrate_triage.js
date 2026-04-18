require('dotenv').config({ path: './backend/.env' });
const { Visit } = require('./backend/models');

async function migrate() {
    try {
        console.log('Starting migration: moving pending_triage patients to waiting_doctor...');
        const count = await Visit.update(
            { queueStatus: 'waiting_doctor' },
            { where: { queueStatus: 'pending_triage' } }
        );
        console.log(`Success! Updated ${count[0]} visits.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
