const { Scheme, sequelize } = require('./models');

async function check() {
    try {
        console.log('--- Database Check ---');

        // Check columns
        const [results] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'schemes'");
        console.log('Columns in schemes table:', results.map(r => r.column_name).join(', '));

        // Check count
        const count = await Scheme.count();
        console.log('Total schemes in database:', count);

        if (count > 0) {
            const first = await Scheme.findOne();
            console.log('First scheme details:', JSON.stringify(first, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

check();
