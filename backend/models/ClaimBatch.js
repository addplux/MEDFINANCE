const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClaimBatch = sequelize.define('ClaimBatch', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    batchNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    month: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    claimCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('open', 'submitted', 'processed', 'paid'),
        defaultValue: 'open'
    },
    submissionDate: {
        type: DataTypes.DATE,
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
    tableName: 'claim_batches',
    timestamps: true,
    underscored: true
});

module.exports = ClaimBatch;
