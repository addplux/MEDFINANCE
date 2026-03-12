const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FileRequest = sequelize.define('FileRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'patients', key: 'id' }
    },
    requestedById: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    assignedToId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
    },
    requestType: {
        type: DataTypes.ENUM('retrieval', 'transfer', 'copy', 'archive'),
        defaultValue: 'retrieval'
    },
    urgency: {
        type: DataTypes.ENUM('normal', 'urgent', 'emergency'),
        defaultValue: 'normal'
    },
    status: {
        type: DataTypes.ENUM('pending', 'searching', 'in_transit', 'delivered', 'returned', 'cancelled'),
        defaultValue: 'pending'
    },
    location: {
        type: DataTypes.STRING(100), // e.g., 'OPD', 'Ward 5', 'Archive Room B'
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    requestedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fulfilledAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'file_requests',
    timestamps: true,
    underscored: true
});

module.exports = FileRequest;
