const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalEntry = sequelize.define('JournalEntry', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    entryNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    entryDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    reference: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    totalDebit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    totalCredit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    status: {
        type: DataTypes.ENUM('draft', 'posted', 'reversed'),
        allowNull: false,
        defaultValue: 'draft'
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    postedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    postedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'journal_entries',
    timestamps: true,
    underscored: true
});

module.exports = JournalEntry;
