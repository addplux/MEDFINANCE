const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    action: {
        type: DataTypes.ENUM('create', 'update', 'delete', 'login', 'logout'),
        allowNull: false
    },
    tableName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    recordId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    changes: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false
});

module.exports = AuditLog;
