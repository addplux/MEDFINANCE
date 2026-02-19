const express = require('express');
const router = express.Router();
const { sequelize, User, Role, Patient } = require('../models');
const { updatePatientBalance } = require('../utils/balanceUpdater');

// Trigger DB Sync
router.get('/sync', async (req, res) => {
    try {
        await sequelize.sync({ alter: true });
        res.json({ message: 'Database synced successfully' });
    } catch (error) {
        console.error('Sync failed:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Check Admin User
router.get('/users/admin', async (req, res) => {
    try {
        const admin = await User.findOne({
            where: { email: 'admin@medfinance360.com' },
            include: [{ model: Role, as: 'userRole' }]
        });

        if (!admin) {
            return res.status(404).json({ error: 'Admin user not found' });
        }

        res.json({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            roleId: admin.roleId,
            userRole: admin.userRole,
            isActive: admin.isActive
        });
    } catch (error) {
        console.error('Check admin failed:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Backfill Patient Balances
router.get('/backfill-balances', async (req, res) => {
    try {
        console.log('🚀 Starting Patient Balance Backfill via API...');
        const patients = await Patient.findAll({ attributes: ['id', 'firstName', 'lastName'] });

        let successCount = 0;
        let errorCount = 0;
        const results = [];

        for (const patient of patients) {
            try {
                const newBalance = await updatePatientBalance(patient.id);
                results.push({ id: patient.id, name: `${patient.firstName} ${patient.lastName}`, balance: newBalance, status: 'ok' });
                successCount++;
            } catch (err) {
                console.error(`Failed for patient ${patient.id}:`, err);
                results.push({ id: patient.id, name: `${patient.firstName} ${patient.lastName}`, error: err.message, status: 'error' });
                errorCount++;
            }
        }

        res.json({
            message: 'Backfill complete',
            stats: { total: patients.length, success: successCount, failed: errorCount },
            details: results
        });
    } catch (error) {
        console.error('Backfill API failed:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
