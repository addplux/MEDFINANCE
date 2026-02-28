const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PayrollDeduction = sequelize.define('PayrollDeduction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    staffId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    staffName: { // Storing name for easier display, or just rely on join
        type: DataTypes.STRING,
        allowNull: true
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    period: {
        type: DataTypes.STRING(7), // YYYY-MM
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Deducted', 'Cancelled'),
        defaultValue: 'Pending'
    },
    deductionDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('Medical Bill', 'Advance', 'Other'),
        defaultValue: 'Medical Bill'
    },
    accountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'chart_of_accounts',
            key: 'id'
        }
    },
    referenceId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    referenceType: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    tableName: 'payroll_deductions',
    timestamps: true,
    underscored: true
});

module.exports = PayrollDeduction;
