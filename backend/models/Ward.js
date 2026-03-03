const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ward = sequelize.define('Ward', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.ENUM('general', 'private', 'semi_private', 'icu', 'maternity', 'pediatric', 'isolation'),
        allowNull: false,
        defaultValue: 'general'
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
        allowNull: false,
        defaultValue: 'active'
    }
}, {
    tableName: 'wards',
    timestamps: true,
    underscored: true
});

module.exports = Ward;
