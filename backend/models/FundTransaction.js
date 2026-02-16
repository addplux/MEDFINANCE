const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FundTransaction = sequelize.define('FundTransaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fundId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'funds',
            key: 'id'
        }
    },
    transactionType: {
        type: DataTypes.ENUM('deposit', 'withdrawal', 'transfer'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    referenceNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    transactionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
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
    tableName: 'fund_transactions',
    timestamps: true,
    underscored: true
});

module.exports = FundTransaction;
