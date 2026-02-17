const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patientNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    nhimaNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    emergencyContact: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    emergencyPhone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'nhima', 'corporate', 'scheme', 'staff'),
        allowNull: false,
        defaultValue: 'cash'
    },
    costCategory: {
        type: DataTypes.ENUM('standard', 'high_cost', 'low_cost'),
        allowNull: false,
        defaultValue: 'standard'
    },
    staffId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'services',
            key: 'id'
        }
    }
}, {
    tableName: 'patients',
    timestamps: true,
    underscored: true
});

module.exports = Patient;
