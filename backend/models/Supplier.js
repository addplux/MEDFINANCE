const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    supplierCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    supplierName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    contactPerson: {
        type: DataTypes.STRING(100),
        allowNull: true
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
    paymentTerms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Payment terms in days'
    },
    taxId: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    bankName: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    bankAccountNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'suppliers',
    timestamps: true,
    underscored: true
});

module.exports = Supplier;
