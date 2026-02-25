/**
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { syncDatabase, User } = require('./models');
const { sequelize, testConnection } = require('./config/database');
const { seedDatabase } = require('./seed');
const { initCronJobs } = require('./jobs/cronManager');

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5180',
    'http://localhost:5181',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5180',
    'http://127.0.0.1:5181',
    'https://medfinance-one.vercel.app',
    'https://medfinance-production.up.railway.app'
];

if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
}

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);

        const isVercel = origin.endsWith('.vercel.app');
        const isAllowed = allowedOrigins.includes(origin) || isVercel || isLocal;

        if (isAllowed || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.error('CORS blocked origin:', origin);
            // Instead of throwing an error which hides the headers, we just don't allow it
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'MEDFINANCE360 API is running' });
});

// Root route for load balancer checks
app.get('/', (req, res) => {
    res.status(200).send('MEDFINANCE360 API is running');
});

// API Routes (will be added in next phases)
app.get('/api', (req, res) => {
    res.json({
        message: 'MEDFINANCE360 API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth/*',
            dashboard: '/api/dashboard/*',
            billing: '/api/billing/*',
            receivables: '/api/receivables/*',
            payables: '/api/payables/*',
            ledger: '/api/ledger/*',
            cash: '/api/cash/*',
            budgets: '/api/budgets/*',
            reports: '/api/reports/*',
            reports: '/api/reports/*',
            setup: '/api/setup/*'
        }
    });
});

// Register routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/receivables', require('./routes/receivables'));
app.use('/api/corporate', require('./routes/corporateRoutes'));
app.use('/api/payables', require('./routes/payables'));
app.use('/api/ledger', require('./routes/ledger'));
app.use('/api/cash', require('./routes/cash'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/funds', require('./routes/funds'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/setup', require('./routes/setup'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/lab', require('./routes/lab'));
app.use('/api/radiology', require('./routes/radiologyRoutes'));
app.use('/api/theatre', require('./routes/theatreRoutes'));
app.use('/api/maternity', require('./routes/maternityRoutes'));
app.use('/api/specialist-clinics', require('./routes/specialistClinicRoutes'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/refunds', require('./routes/refunds'));
app.use('/api/debug', require('./routes/debug'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/patient-movements', require('./routes/patientMovements'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/prepaid-plans', require('./routes/prepaidPlans'));
app.use('/api/utilisation', require('./routes/utilisation'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // Start listening immediately to ensure port binding satisfies deployment checks
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔌 PORT env var: ${process.env.PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV}`);
        console.log(`🔗 API: http://0.0.0.0:${PORT}/api`);
    });

    try {
        console.log('⏳ Initializing database connection...');
        // Test database connection
        await testConnection();

        // Sync database models
        console.log('⏳ Syncing database models...');
        try {
            // Schema is already in sync — use alter: false so startup is instant
            await syncDatabase({ alter: false });
            console.log('✅ Database synchronized successfully');
        } catch (syncError) {
            console.error('⚠️ Database synchronization failed:', syncError);
        }

        // Run one-time migrations (safe, idempotent)
        try {
            const runPaymentEnumMigration = require('./migrations/addPaymentEnums');
            await runPaymentEnumMigration();
        } catch (migErr) {
            console.error('⚠️ Migration runner error (non-fatal):', migErr.message);
        }

        // Auto-seed if database is empty
        try {
            const userCount = await User.count();
            if (userCount === 0) {
                console.log('🌱 Database appears empty. Running auto-seed...');
                await seedDatabase();
                console.log('✅ Auto-seed completed.');
            }
        } catch (seedError) {
            console.error('⚠️ Auto-seed check failed:', seedError);
        }

        // Initialize background jobs
        initCronJobs();

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        // We keep the server running to serve health checks and error logs
    }
};

startServer();
