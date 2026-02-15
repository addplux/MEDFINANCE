const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChartOfAccounts = sequelize.define('ChartOfAccounts', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    accountCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    accountName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    accountType: {
        type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
        allowNull: false
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'chart_of_accounts',
            key: 'id'
        }
    },
    balance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'chart_of_accounts',
    timestamps: true,
    underscored: true
});

module.exports = ChartOfAccounts;
