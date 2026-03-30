process.env.DATABASE_URL = '"postgresql://localhost:5432/test_db"'; // simulate quotes
process.env.DB_NAME = 'test_db';

try {
  const { sequelize } = require('./backend/config/database');
  console.log('✅ Sequelize initialization succeeded without crash!');
  console.log('✅ Dialect selected:', sequelize.options.dialect);
} catch (error) {
  console.error('❌ Initialization failed:', error);
}
