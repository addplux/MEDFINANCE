/**
 * MEDFINANCE360 Notification Routes
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getNotifications, getUnreadCount, markAsRead, markAllRead } = require('../controllers/notificationController');

router.get('/', authMiddleware, getNotifications);
router.get('/count', authMiddleware, getUnreadCount);
router.put('/read-all', authMiddleware, markAllRead);
router.put('/:id/read', authMiddleware, markAsRead);

module.exports = router;
