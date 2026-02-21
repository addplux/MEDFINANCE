const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LabRequest = sequelize.define('LabRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    requestNumber: {
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
    requestedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        } // Doctor/Staff who ordered
    },
    status: {
        type: DataTypes.ENUM('requested', 'sample_collected', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'requested'
    },
    priority: {
        type: DataTypes.ENUM('routine', 'urgent', 'stat'),
        defaultValue: 'routine'
    },
    clinicalNotes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    requestDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Sum of all test prices in this request'
    },
    paymentStatus: {
        type: DataTypes.ENUM('unpaid', 'paid', 'prepaid', 'claimed', 'waived'),
        allowNull: false,
        defaultValue: 'unpaid'
    }
}, {
    tableName: 'lab_requests',
    timestamps: true,
    underscored: true
});

module.exports = LabRequest;
