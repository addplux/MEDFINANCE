const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PharmacyBill = sequelize.define('PharmacyBill', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    billNumber: {
        type: DataTypes.STRING(20),
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
    medication: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    batchNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    netAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    billDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    prescriptionNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
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
    tableName: 'pharmacy_bills',
    timestamps: true,
    underscored: true
});

module.exports = PharmacyBill;
