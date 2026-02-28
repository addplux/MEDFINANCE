const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM(
            'superintendent', // Medical Director — full system access
            'admin',          // System Administrator
            'doctor',         // Medical Officer
            'nurse',          // Nurse / Ward Staff
            'accountant',     // Chief Accountant / Finance Officer
            'cashier',        // Cashier / Billing Clerk
            'pharmacist',     // Pharmacist / Dispenser
            'lab_technician', // Laboratory Technician
            'radiographer',   // Radiographer
            'billing_staff',  // Legacy: kept for backward compatibility
            'viewer'          // Read-only observer
        ),
        allowNull: false,
        defaultValue: 'viewer'
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'roles',
            key: 'id'
        }
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
    },
    department: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    rejectionReason: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    medicalLimitMonthly: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    medicalLimitAnnual: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    medicalUsageMonthly: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    medicalUsageAnnual: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    relationshipToStaff: {
        type: DataTypes.ENUM('Self', 'Spouse', 'Child'),
        defaultValue: 'Self'
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get safe user object (without password)
User.prototype.toSafeObject = function () {
    const { password, ...safeUser } = this.toJSON();
    return safeUser;
};

module.exports = User;
