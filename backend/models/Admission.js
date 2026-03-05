const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Admission = sequelize.define('Admission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    admissionNumber: {
        type: DataTypes.STRING(30),
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
    visitId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'visits',
            key: 'id'
        }
    },
    wardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'wards',
            key: 'id'
        }
    },
    bedId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'beds',
            key: 'id'
        }
    },
    admittingDoctorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    admissionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    dischargeDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    depositAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('admitted', 'discharged', 'transferred', 'cancelled'),
        allowNull: false,
        defaultValue: 'admitted'
    },
    admittedById: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'The user who processed the admission in the system'
    }
}, {
    tableName: 'admissions',
    timestamps: true,
    underscored: true
});

module.exports = Admission;
