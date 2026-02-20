const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PatientMovement = sequelize.define('PatientMovement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'patients',
            key: 'id'
        }
    },
    fromDepartment: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    toDepartment: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    movementDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    admittedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'patient_movements',
    timestamps: true,
    underscored: true
});

module.exports = PatientMovement;
