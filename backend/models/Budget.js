const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Budget = sequelize.define('Budget', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id'
        }
    },
    fiscalYear: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    budgetedAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    actualAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    variance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    variancePercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00
    },
    quarter: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 4
        }
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'budgets',
    timestamps: true,
    underscored: true
});

module.exports = Budget;
