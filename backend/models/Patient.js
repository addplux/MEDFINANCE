const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patientNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    nhimaNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    photoUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    emergencyContact: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    emergencyPhone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'nhima', 'corporate', 'scheme', 'staff', 'exempted'),
        allowNull: false,
        defaultValue: 'cash'
    },
    costCategory: {
        type: DataTypes.ENUM('standard', 'high_cost', 'low_cost'),
        allowNull: false,
        defaultValue: 'standard'
    },
    staffId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    schemeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'schemes',
            key: 'id'
        }
    },
    policyNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    memberRank: {
        type: DataTypes.ENUM('principal', 'spouse', 'child', 'dependant', 'other'),
        allowNull: true
    },
    nrc: { // National Registration Card
        type: DataTypes.STRING(20),
        allowNull: true
    },
    memberStatus: {
        type: DataTypes.ENUM('active', 'suspended', 'closed', 'not_collected'),
        allowNull: false,
        defaultValue: 'active'
    },
    memberSuffix: { // 1=Principal, 2=Spouse, etc.
        type: DataTypes.INTEGER,
        allowNull: true
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'services',
            key: 'id'
        }
    },
    ward: {
        type: DataTypes.ENUM('male_ward', 'female_ward', 'general_ward', 'pediatric_ward', 'icu'),
        allowNull: true
    },
    balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    // Detailed Balances (Imported)
    nursingCare: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    laboratory: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    radiology: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    dental: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    lodging: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    surgicals: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    drRound: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    food: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    physio: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    pharmacy: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    sundries: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    antenatal: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 }
}, {
    tableName: 'patients',
    timestamps: true,
    underscored: true
});

module.exports = Patient;
