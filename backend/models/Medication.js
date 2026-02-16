const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Medication = sequelize.define('Medication', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: false // e.g., Tablet, Syrup, Injection, Consumable
    },
    unitOfMeasure: {
        type: DataTypes.STRING(20),
        allowNull: false // e.g., box, piece, bottle
    },
    manufacturer: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    reorderLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'medications',
    timestamps: true,
    underscored: true
});

module.exports = Medication;
