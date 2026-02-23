const { Scheme, sequelize } = require('./models');
const fs = require('fs');

async function dump() {
    try {
        const schemes = await Scheme.findAll();
        fs.writeFileSync('schemes_dump.json', JSON.stringify(schemes, null, 2));
        console.log(`Dumped ${schemes.length} schemes.`);
        process.exit(0);
    } catch (error) {
        fs.writeFileSync('schemes_dump_error.txt', error.stack);
        process.exit(1);
    }
}

dump();
