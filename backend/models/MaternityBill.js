const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MaternityBill = sequelize.define('MaternityBill', {
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
    admissionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    deliveryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    deliveryType: {
        type: DataTypes.ENUM('normal', 'c-section', 'assisted', 'other'),
        allowNull: false
    },
    doctorName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    nurseName: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    bedCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    deliveryCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    doctorFees: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    nurseFees: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    medications: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    labTests: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    paymentStatus: {
        type: DataTypes.ENUM('unpaid', 'paid', 'claimed', 'voided'),
        allowNull: false,
        defaultValue: 'unpaid'
    },
    amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    babyDetails: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON object with baby information: {name, gender, weight, time, status}'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'maternity_bills',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeSave: (bill) => {
            // Auto-calculate total amount
            bill.totalAmount = parseFloat(bill.bedCharges || 0) +
                parseFloat(bill.deliveryCharges || 0) +
                parseFloat(bill.doctorFees || 0) +
                parseFloat(bill.nurseFees || 0) +
                parseFloat(bill.medications || 0) +
                parseFloat(bill.labTests || 0);
        }
    }
});

module.exports = MaternityBill;
