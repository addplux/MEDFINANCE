const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PharmacyBatch = sequelize.define('PharmacyBatch', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    medicationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'medications',
            key: 'id'
        }
    },
    batchNumber: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    expiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    quantityReceived: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantityOnHand: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unitCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    sellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    supplier: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    receivedDate: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'pharmacy_batches',
    timestamps: true,
    underscored: true
});

module.exports = PharmacyBatch;
