const express = require('express');
const router = express.Router();
const { sequelize, User, Role } = require('../models');

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

module.exports = router;
