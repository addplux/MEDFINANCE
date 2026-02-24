const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fund = sequelize.define('Fund', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Create LabBill records if the patient is on a scheme (corporate, scheme)
    fundCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    fundName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    fundType: {
        type: DataTypes.ENUM('donor', 'retention', 'general'),
        allowNull: false,
        defaultValue: 'general'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    balance: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    status: {
        type: DataTypes.ENUM('active', 'closed'),
        allowNull: false,
        defaultValue: 'active'
    }
}, {
    tableName: 'funds',
    timestamps: true,
    underscored: true
});

module.exports = Fund;
