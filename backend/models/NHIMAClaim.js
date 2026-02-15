const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NHIMAClaim = sequelize.define('NHIMAClaim', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    claimNumber: {
        type: DataTypes.STRING(50),
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
    nhimaNumber: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    claimAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    approvedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    submissionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    approvalDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'submitted', 'approved', 'rejected', 'paid'),
        allowNull: false,
        defaultValue: 'pending'
    },
    rejectionReason: {
        type: DataTypes.TEXT,
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
    tableName: 'nhima_claims',
    timestamps: true,
    underscored: true
});

module.exports = NHIMAClaim;
