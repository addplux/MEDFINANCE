const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bed = sequelize.define('Bed', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    wardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'wards',
            key: 'id'
        }
    },
    bedNumber: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'cleaning'),
        allowNull: false,
        defaultValue: 'available'
    },
    currentAdmissionId: {
        type: DataTypes.INTEGER,
        allowNull: true
        // Note: foreign key to admissions will be established in models/index.js
    }
}, {
    tableName: 'beds',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['ward_id', 'bed_number']
        }
    ]
});

module.exports = Bed;
