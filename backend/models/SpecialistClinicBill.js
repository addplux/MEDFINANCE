const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SpecialistClinicBill = sequelize.define('SpecialistClinicBill', {
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
    clinicType: {
        type: DataTypes.ENUM(
            'cardiology',
            'orthopedics',
            'neurology',
            'dermatology',
            'ophthalmology',
            'ent',
            'gynecology',
            'urology',
            'pediatrics',
            'psychiatry',
            'other'
        ),
        allowNull: false
    },
    specialistName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    consultationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    consultationFees: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    procedureFees: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Any minor procedures performed during consultation'
    },
    diagnosticTests: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    medications: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    followUpRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    followUpDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
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
    diagnosis: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'specialist_clinic_bills',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeSave: (bill) => {
            // Auto-calculate total amount
            bill.totalAmount = parseFloat(bill.consultationFees || 0) +
                parseFloat(bill.procedureFees || 0) +
                parseFloat(bill.diagnosticTests || 0) +
                parseFloat(bill.medications || 0);
        }
    }
});

module.exports = SpecialistClinicBill;
