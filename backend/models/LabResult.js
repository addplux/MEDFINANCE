const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LabResult = sequelize.define('LabResult', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    labRequestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'lab_requests',
            key: 'id'
        }
    },
    testId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'lab_tests',
            key: 'id'
        }
    },
    resultValue: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isAbnormal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    technicianId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    verifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'lab_results',
    timestamps: true,
    underscored: true
});

module.exports = LabResult;
