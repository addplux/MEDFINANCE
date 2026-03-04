try {
    console.log('Requiring models...');
    const models = require('./backend/models');
    console.log('✅ Models loaded');

    console.log('Requiring billing controller...');
    const billingController = require('./backend/controllers/billingController');
    console.log('✅ Billing controller loaded');

    console.log('Requiring visit controller...');
    const visitController = require('./backend/controllers/visitController');
    console.log('✅ Visit controller loaded');

    console.log('Requiring auth controller...');
    const authController = require('./backend/controllers/authController');
    console.log('✅ Auth controller loaded');

    console.log('Requiring all routes...');
    // We mock some things to avoid side effects if they depend on something global
    const authRoutes = require('./backend/routes/auth');
    const billingRoutes = require('./backend/routes/billing');
    const visitRoutes = require('./backend/routes/visits');
    console.log('✅ Routes loaded');

    console.log('Success: All modules required successfully.');
} catch (error) {
    console.error('❌ Failed to require modules:');
    console.error(error.stack);
    process.exit(1);
}
