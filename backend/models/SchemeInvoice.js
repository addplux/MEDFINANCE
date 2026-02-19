const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SchemeInvoice = sequelize.define('SchemeInvoice', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoiceNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    schemeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'schemes',
            key: 'id'
        }
    },
    periodStart: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    periodEnd: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('draft', 'final', 'sent', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
    },
    generatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    breakdown: {
        type: DataTypes.JSONB, // For storing calculated totals if needed
        allowNull: true
    }
}, {
    tableName: 'scheme_invoices',
    timestamps: true,
    underscored: true
});

module.exports = SchemeInvoice;
