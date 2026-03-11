const express = require('express');
const router = express.Router();
const { AuditLog, User } = require('../models');
const { authMiddleware, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

router.use(authMiddleware);
router.use(authorize('admin', 'superintendent'));

// GET /api/audit-logs — paginated, filterable
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 100, action, userId, tableName, startDate, endDate } = req.query;
        const where = {};
        if (action) where.action = action;
        if (userId) where.userId = userId;
        if (tableName) where.tableName = { [Op.iLike]: `%${tableName}%` };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59');
        }

        const { count, rows } = await AuditLog.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: Math.min(Number(limit), 500),
            offset: (Number(page) - 1) * Number(limit),
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'role'],
                required: false
            }]
        });

        res.json({ success: true, data: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
    }
});

module.exports = router;
