const { sequelize } = require('../config/database');

async function inspect() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');
        const qi = sequelize.getQueryInterface();

        console.log('Inspecting tables...');
        const users = await qi.describeTable('users');
        const services = await qi.describeTable('services');
        const patients = await qi.describeTable('patients');

        const dump = {
            users,
            services,
            patients
        };
        require('fs').writeFileSync('schema_dump.json', JSON.stringify(dump, null, 2));
        console.log('Schema dumped to schema_dump.json');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspect();
