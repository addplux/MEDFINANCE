require('dotenv').config();

console.log('Testing model loading...');

try {
    const models = require('./models');
    console.log('✅ Models loaded successfully');
    console.log('Available models:', Object.keys(models));
} catch (error) {
    console.error('❌ Error loading models:');
    console.error(error);
    process.exit(1);
}
