const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IPDBill = sequelize.define('IPDBill', {
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
    admissionDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    dischargeDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    roomType: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    roomCharges: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    medicationCharges: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    procedureCharges: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    otherCharges: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
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
    status: {
        type: DataTypes.ENUM('active', 'discharged', 'paid', 'partially_paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
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
    tableName: 'ipd_bills',
    timestamps: true,
    underscored: true
});

module.exports = IPDBill;
