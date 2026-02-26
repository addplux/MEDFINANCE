const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemLog = sequelize.define('SystemLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    level: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'error'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    stackTrace: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    route: {
        type: DataTypes.STRING,
        allowNull: true
    },
    method: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    resolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'system_logs',
    timestamps: true,
    underscored: true
});

module.exports = SystemLog;
