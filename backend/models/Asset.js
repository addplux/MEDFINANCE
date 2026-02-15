const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Asset = sequelize.define('Asset', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    assetCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    assetName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('building', 'equipment', 'furniture', 'vehicle', 'computer', 'other'),
        allowNull: false
    },
    departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'departments',
            key: 'id'
        }
    },
    purchaseDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    cost: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    salvageValue: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    usefulLife: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Useful life in years'
    },
    depreciationMethod: {
        type: DataTypes.ENUM('straight_line', 'declining_balance', 'units_of_production'),
        allowNull: false,
        defaultValue: 'straight_line'
    },
    accumulatedDepreciation: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    bookValue: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'disposed', 'under_maintenance', 'retired'),
        allowNull: false,
        defaultValue: 'active'
    },
    serialNumber: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'assets',
    timestamps: true,
    underscored: true
});

module.exports = Asset;
