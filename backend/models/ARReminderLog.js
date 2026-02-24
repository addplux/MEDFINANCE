/**
 * MEDFINANCE360 AR Reminder Log Model
 * Tracks automated debt reminders sent via Email or SMS.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ARReminderLog = sequelize.define('ARReminderLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.STRING(30),
        allowNull: true,
        comment: 'e.g., cash, corporate, scheme, staff'
    },
    agingBucket: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Days overdue (30, 60, 90, etc.)'
    },
    reminderType: {
        type: DataTypes.ENUM('email', 'sms', 'both'),
        allowNull: false,
        defaultValue: 'email'
    },
    sentDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('success', 'failed'),
        allowNull: false,
        defaultValue: 'success'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'ar_reminder_logs',
    timestamps: true,
    underscored: true
});

module.exports = ARReminderLog;
