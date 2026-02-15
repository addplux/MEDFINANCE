const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PettyCash = sequelize.define('PettyCash', {
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
    transactionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    transactionType: {
        type: DataTypes.ENUM('expense', 'reimbursement'),
        allowNull: false
    },
    payee: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
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
    tableName: 'petty_cash',
    timestamps: true,
    underscored: true
});

module.exports = PettyCash;
