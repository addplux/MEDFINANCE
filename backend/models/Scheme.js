const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Scheme = sequelize.define('Scheme', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    schemeCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    schemeName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    schemeType: {
        type: DataTypes.ENUM('insurance', 'corporate', 'government', 'ngo', 'other'),
        allowNull: false
    },
    billingCycle: {
        type: DataTypes.ENUM('monthly', 'quarterly', 'annually'),
        allowNull: false,
        defaultValue: 'monthly'
    },
    pricingModel: {
        type: DataTypes.ENUM('standard', 'tiered'),
        allowNull: false,
        defaultValue: 'standard'
    },
    discountRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        comment: 'Discount percentage'
    },
    creditLimit: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        comment: 'Total credit allowed for this scheme'
    },
    outstandingBalance: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        comment: 'Current unpaid balance for this scheme'
    },
    contactPerson: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    paymentTermsDays: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        comment: 'Default number of days until payment is due'
    },
    gracePeriodDays: {
        type: DataTypes.INTEGER,
        defaultValue: 7,
        comment: 'Additional days before late fees apply'
    },
    latePaymentRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        comment: 'Interest rate for overdue payments (%)'
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        defaultValue: 'Bank Transfer'
    }
}, {
    tableName: 'schemes',
    timestamps: true,
    underscored: true
});

module.exports = Scheme;
