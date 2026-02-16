const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Organization = sequelize.define('Organization', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Private Hospital', 'Mission / NGO', 'Government', 'Clinic', 'Other'),
        allowNull: false,
        defaultValue: 'Private Hospital'
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    website: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    taxId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'tax_id'
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'ZMW'
    },
    logo: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'organizations',
    timestamps: true,
    underscored: true
});

module.exports = Organization;
