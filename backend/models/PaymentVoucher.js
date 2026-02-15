const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentVoucher = sequelize.define('PaymentVoucher', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    voucherNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'invoices',
            key: 'id'
        }
    },
    paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'cheque', 'bank_transfer', 'mobile_money', 'other'),
        allowNull: false
    },
    referenceNumber: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    bankName: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    chequeNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'processed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
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
    tableName: 'payment_vouchers',
    timestamps: true,
    underscored: true
});

module.exports = PaymentVoucher;
