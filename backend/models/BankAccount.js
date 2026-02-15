const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BankAccount = sequelize.define('BankAccount', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    accountNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    bankName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    accountName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    accountType: {
        type: DataTypes.ENUM('current', 'savings', 'fixed_deposit'),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'ZMW'
    },
    balance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    branchName: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'closed'),
        allowNull: false,
        defaultValue: 'active'
    }
}, {
    tableName: 'bank_accounts',
    timestamps: true,
    underscored: true
});

module.exports = BankAccount;
