const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('Invoice', {
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
    supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'suppliers',
            key: 'id'
        }
    },
    invoiceDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    netAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    paidAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'paid', 'partially_paid', 'overdue', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'invoices',
    timestamps: true,
    underscored: true
});

module.exports = Invoice;
