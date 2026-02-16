/**
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { syncDatabase } = require('./models');
const { sequelize, testConnection } = require('./config/database');

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5180',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5180',
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'MEDFINANCE360 API is running' });
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
            assets: '/api/assets/*',
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
app.use('/api/payables', require('./routes/payables'));
app.use('/api/ledger', require('./routes/ledger'));
app.use('/api/cash', require('./routes/cash'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/funds', require('./routes/funds'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/setup', require('./routes/setup'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/lab', require('./routes/lab'));

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
    try {
        // Test database connection
        await testConnection();

        // Sync database models (create tables if they don't exist)
        try {
            await syncDatabase({ alter: true });
            console.log('✅ Database synchronized successfully');
        } catch (syncError) {
            console.error('⚠️ Database synchronization failed, but starting server anyway:', syncError);
        }

        // Start listening
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🔌 PORT env var: ${process.env.PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV}`);
            console.log(`🔗 API: http://0.0.0.0:${PORT}/api`);
        });
    } catch (error) {
        console.error('Failed to start server process:', error);
        // Still try to start the app so we can see error pages/logs through HTTP
        app.listen(PORT, () => {
            console.log(`🚀 Server emergency started on port ${PORT} despite startup errors`);
        });
    }
};

startServer();
