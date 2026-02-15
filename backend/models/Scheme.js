const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Scheme = sequelize.define('Scheme', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    schemeCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    schemeName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    schemeType: {
        type: DataTypes.ENUM('insurance', 'corporate', 'government', 'ngo', 'other'),
        allowNull: false
    },
    discountRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        comment: 'Discount percentage'
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
    tableName: 'schemes',
    timestamps: true,
    underscored: true
});

module.exports = Scheme;
