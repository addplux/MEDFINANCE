const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OnlineTransaction = sequelize.define('OnlineTransaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    transactionId: {
        type: DataTypes.STRING(100),
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
    currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'ZMW'
    },
    gateway: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'e.g. paystack, flutterwave, dpo, mtn_momo'
    },
    gatewayReference: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'successful', 'failed', 'abandoned'),
        allowNull: false,
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g. mobile_money, card'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'online_transactions',
    timestamps: true,
    underscored: true
});

module.exports = OnlineTransaction;