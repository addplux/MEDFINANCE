const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LabTest = sequelize.define('LabTest', {
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
    category: {
        type: DataTypes.STRING(50),
        allowNull: false // e.g., Hematology, Biochemistry, Microbiology, Serology
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    normalRange: {
        type: DataTypes.TEXT, // Can be JSON string or simple text e.g., "10-50 mg/dL"
        allowNull: true
    },
    units: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'lab_tests',
    timestamps: true,
    underscored: true
});

module.exports = LabTest;
