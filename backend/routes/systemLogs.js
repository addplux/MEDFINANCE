const express = require('express');
const router = express.Router();
const { SystemLog } = require('../models');

// Get all system logs (latest first)
router.get('/', async (req, res) => {
    try {
        const logs = await SystemLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 1000 // Limit to avoid large payloads
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Error fetching system logs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch logs' });
    }
});

// Wipe all system logs
router.delete('/wipe', async (req, res) => {
    try {
        await SystemLog.destroy({ where: {} });
        res.json({ success: true, message: 'All logs wiped successfully' });
    } catch (error) {
        console.error('Error wiping system logs:', error);
        res.status(500).json({ success: false, error: 'Failed to wipe logs' });
    }
});

// Mark a single log as resolved/unresolved
router.patch('/:id/resolve', async (req, res) => {
    try {
        const log = await SystemLog.findByPk(req.params.id);
        if (!log) return res.status(404).json({ success: false, error: 'Log not found' });

        log.resolved = !log.resolved;
        await log.save();
        res.json({ success: true, data: log });
    } catch (error) {
        console.error('Error updating log status:', error);
        res.status(500).json({ success: false, error: 'Failed to update log status' });
    }
});

module.exports = router;
