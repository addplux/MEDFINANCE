const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * SchemeService — stores the specific services a scheme covers
 * and what custom prices (overrides) apply for each.
 * If schemePrice is null, the standard service tariff is used.
 */
const SchemeService = sequelize.define('SchemeService', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    schemeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'schemes', key: 'id' }
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'services', key: 'id' }
    },
    schemePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Custom price override for this service under this scheme. NULL = use standard tariff.'
    },
    isCovered: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this service is covered/included under the scheme'
    },
    notes: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'scheme_services',
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ['scheme_id', 'service_id'] }]
});

module.exports = SchemeService;
