require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { syncDatabase } = require('./models');
const { sequelize, testConnection } = require('./config/database');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
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
app.use('/api/assets', require('./routes/assets'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/setup', require('./routes/setup'));

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
        await syncDatabase({ alter: false }); // Use { force: true } to drop and recreate tables

        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV}`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
