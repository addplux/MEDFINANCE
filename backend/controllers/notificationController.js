/**
 * MEDFINANCE360 Notification Controller
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

const { Notification } = require('../models');

// GET /api/notifications — get all notifications for logged-in user
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// GET /api/notifications/count — unread count (for badge)
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.count({
            where: { userId: req.user.id, isRead: false }
        });
        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get notification count' });
    }
};

// PUT /api/notifications/:id/read — mark single as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOne({
            where: { id, userId: req.user.id }
        });
        if (!notification) return res.status(404).json({ error: 'Notification not found' });

        await notification.update({ isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// PUT /api/notifications/read-all — mark all as read
const markAllRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { where: { userId: req.user.id, isRead: false } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllRead };
