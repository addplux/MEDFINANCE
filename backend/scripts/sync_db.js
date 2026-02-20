const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { sequelize } = require('../models');

const syncDB = async () => {
    try {
        console.log('Syncing database...');
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');
    } catch (error) {
        console.error('Error syncing database:', error);
    } finally {
        await sequelize.close();
    }
};

syncDB();
