const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shift = sequelize.define('Shift', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    startCash: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    endCash: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    systemCalculatedCash: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('open', 'closed'),
        allowNull: false,
        defaultValue: 'open'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'shifts',
    timestamps: true,
    underscored: true
});

module.exports = Shift;
