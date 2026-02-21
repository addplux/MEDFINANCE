const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrepaidPlan = sequelize.define('PrepaidPlan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    planKey: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: 'unique_plan_key'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    color: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '#6366f1'
    },
    icon: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'shield'
    },
    monthlyPremium: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    annualPremium: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    coverageLimit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    benefits: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'prepaid_plans',
    timestamps: true,
    underscored: true
});

module.exports = PrepaidPlan;
