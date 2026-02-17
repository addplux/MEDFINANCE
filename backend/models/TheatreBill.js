const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TheatreBill = sequelize.define('TheatreBill', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    billNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'patients',
            key: 'id'
        }
    },
    procedureType: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Type of surgical procedure'
    },
    surgeonName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    anesthetistName: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    procedureDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    theatreCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Base theatre room charges'
    },
    surgeonFees: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Surgeon professional fees'
    },
    anesthetistFees: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Anesthetist fees'
    },
    consumables: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Cost of consumables used during procedure'
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'partial', 'paid'),
        allowNull: false,
        defaultValue: 'pending'
    },
    amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'theatre_bills',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeSave: (bill) => {
            // Auto-calculate total amount
            bill.totalAmount = parseFloat(bill.theatreCharges || 0) +
                parseFloat(bill.surgeonFees || 0) +
                parseFloat(bill.anesthetistFees || 0) +
                parseFloat(bill.consumables || 0);
        }
    }
});

module.exports = TheatreBill;
