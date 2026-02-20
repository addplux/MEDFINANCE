const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LabBill = sequelize.define('LabBill', {
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
    testName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    testCode: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    amount: {
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
        type: DataTypes.ENUM('pending', 'completed', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    paymentStatus: {
        type: DataTypes.ENUM('unpaid', 'paid', 'claimed', 'voided'),
        allowNull: false,
        defaultValue: 'unpaid'
    },
    sampleCollected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    resultDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    schemeInvoiceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'scheme_invoices',
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
    tableName: 'lab_bills',
    timestamps: true,
    underscored: true
});

module.exports = LabBill;
