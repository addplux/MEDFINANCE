require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false,
    pool: { max: 2, min: 0, acquire: 15000, idle: 5000 }
});

sequelize.authenticate()
    .then(() => {
        console.log('✅ Sequelize connected!');
        return sequelize.query('SELECT id, scheme_name, scheme_type, status FROM schemes', { type: sequelize.QueryTypes.SELECT });
    })
    .then(rows => {
        console.log('✅ Schemes from Sequelize:', JSON.stringify(rows, null, 2));
        process.exit(0);
    })
    .catch(e => {
        console.error('❌ Sequelize error:', e.name, e.message);
        process.exit(1);
    });
