const { sequelize } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Running Asset table migration...');

        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', '002_update_asset_schema.sql'),
            'utf8'
        );

        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 50) + '...');
            await sequelize.query(statement);
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
