const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalLine = sequelize.define('JournalLine', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    entryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'journal_entries',
            key: 'id'
        }
    },
    accountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'chart_of_accounts',
            key: 'id'
        }
    },
    debit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    credit: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'journal_lines',
    timestamps: true,
    underscored: true
});

module.exports = JournalLine;
