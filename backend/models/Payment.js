const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    receiptNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'patients',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'mobile_money', 'bank_transfer', 'cheque', 'insurance'),
        allowNull: false
    },
    referenceNumber: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    billType: {
        type: DataTypes.ENUM('opd', 'ipd', 'pharmacy', 'laboratory', 'radiology', 'theatre', 'maternity', 'specialist', 'multiple', 'other'),
        allowNull: true
    },
    billId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    receivedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'payments',
    timestamps: true,
    underscored: true
});

module.exports = Payment;
