const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CorporateAccount = sequelize.define('CorporateAccount', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    accountNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    companyName: {
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
    creditLimit: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00
    },
    currentBalance: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00
    },
    paymentTerms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Payment terms in days'
    },
    status: {
        type: DataTypes.ENUM('active', 'suspended', 'closed'),
        allowNull: false,
        defaultValue: 'active'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'corporate_accounts',
    timestamps: true,
    underscored: true
});

module.exports = CorporateAccount;
