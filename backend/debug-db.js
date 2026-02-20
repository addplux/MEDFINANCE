require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('--- Database Debug Script ---');
console.log('Environment:', process.env.NODE_ENV);
console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

async function test() {
    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL is missing!');
        return;
    }

    const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: console.log
    });

    try {
        console.log('Attempting to authenticate...');
        await sequelize.authenticate();
        console.log('✅ Connection Sucessful!');
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.original) {
            console.error('Original Error:', error.original.code, error.original.hostname);
        }
    } finally {
        await sequelize.close();
    }
}

test();
