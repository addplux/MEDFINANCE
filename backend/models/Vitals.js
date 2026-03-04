const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vitals = sequelize.define('Vitals', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'visits', key: 'id' }
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'patients', key: 'id' }
    },
    recordedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
    },
    bloodPressure: { type: DataTypes.STRING(20), allowNull: true },
    temperature: { type: DataTypes.DECIMAL(4, 1), allowNull: true },
    pulse: { type: DataTypes.INTEGER, allowNull: true },
    respiratoryRate: { type: DataTypes.INTEGER, allowNull: true },
    spo2: { type: DataTypes.INTEGER, allowNull: true },
    weight: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
    height: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
    bmi: { type: DataTypes.DECIMAL(4, 1), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'vitals',
    timestamps: true,
    underscored: true
});

module.exports = Vitals;
