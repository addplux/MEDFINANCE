/**
 * MEDFINANCE360 Notification Model
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Recipient user (admin)'
    },
    type: {
        type: DataTypes.ENUM('registration_request', 'account_approved', 'account_rejected', 'general'),
        allowNull: false,
        defaultValue: 'general'
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Extra data e.g. { pendingUserId: 5 }'
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true
});

module.exports = Notification;
