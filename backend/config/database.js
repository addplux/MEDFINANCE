/**
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Support both DATABASE_URL and individual parameters
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      // Required for Supabase Transaction Pooler (port 6543)
      // pgBouncer disables named prepared statements which are not supported
      pgBouncer: true,
      prepareThreshold: 0
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 3,
      min: 0,
      acquire: 60000,
      idle: 10000,
      evict: 1000
    }
  })
  : new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.DB_HOST?.includes('supabase.co') ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, testConnection };
