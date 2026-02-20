const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Visit = sequelize.define('Visit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visitNumber: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
    },
    visitType: {
        type: DataTypes.ENUM('opd', 'inpatient', 'maternity', 'emergency'),
        allowNull: false,
        defaultValue: 'opd'
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'patients', key: 'id' }
    },
    schemeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'schemes', key: 'id' }
    },
    departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'departments', key: 'id' }
    },
    assignedDepartment: {
        // Free-text department label when no Department record exists
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'discharged', 'transferred', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
    },
    admittedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
    },
    admissionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    dischargeDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'visits',
    timestamps: true,
    underscored: true
});

module.exports = Visit;
