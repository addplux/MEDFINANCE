const {
    Patient, sequelize, OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill,
    TheatreBill, MaternityBill, SpecialistClinicBill, NHIMAClaim, Payment, LabRequest
} = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Get all patients
const getAllPatients = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (search) {
            where[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { patientNumber: { [Op.iLike]: `%${search}%` } },
                { policyNumber: { [Op.iLike]: `%${search}%` } },
                { nhimaNumber: { [Op.iLike]: `%${search}%` } },
                { nrc: { [Op.iLike]: `%${search}%` } } // Added NRC search
            ];
        }

        const { count, rows } = await Patient.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ error: 'Failed to get patients' });
    }
};

// Get single patient
const getPatient = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error('Get patient error:', error);
        res.status(500).json({ error: 'Failed to get patient' });
    }
};

// Create patient
const createPatient = async (req, res) => {
    try {
        const {
            firstName, lastName, dateOfBirth, gender, phone, email, address,
            nhimaNumber, paymentMethod, costCategory, staffId, serviceId, ward,
            emergencyContact, emergencyPhone, nrc
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !dateOfBirth || !gender) {
            return res.status(400).json({ error: 'First name, last name, date of birth, and gender are required' });
        }

        // Generate patient number
        const patientCount = await Patient.count();
        const patientNumber = `P${String(patientCount + 1).padStart(6, '0')}`;

        // Handle photo upload
        let photoUrl = null;
        if (req.file) {
            photoUrl = `/uploads/patients/${req.file.filename}`;
        }

        const patient = await Patient.create({
            patientNumber,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            phone,
            email,
            address,
            nhimaNumber,
            paymentMethod: paymentMethod || 'cash',
            costCategory: costCategory || 'standard',
            staffId: (paymentMethod === 'staff' && staffId) ? staffId : null,
            serviceId: serviceId || null,
            ward: ward || null,
            emergencyContact,
            emergencyPhone,
            nrc,
            photoUrl
        });

        res.status(201).json(patient);
    } catch (error) {
        console.error('Create patient error:', error);
        res.status(500).json({
            error: 'Failed to create patient',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Update patient
const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const oldData = patient.toJSON();
        const updateData = { ...req.body };

        // Handle photo upload
        if (req.file) {
            // Delete old photo if exists
            if (patient.photoUrl) {
                const oldPhotoPath = path.join(__dirname, '..', patient.photoUrl);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }
            updateData.photoUrl = `/uploads/patients/${req.file.filename}`;
        }

        await patient.update(updateData);

        // Audit Logging for Financial Fields
        const financialFields = [
            'nursingCare', 'laboratory', 'radiology', 'dental', 'lodging',
            'surgicals', 'drRound', 'food', 'physio', 'pharmacy', 'sundries', 'antenatal', 'balance'
        ];

        const changes = {};
        let hasFinancialChanges = false;

        financialFields.forEach(field => {
            // Compare as numbers to avoid "100.00" != "100" false positives, defaulting to 0
            const oldVal = Number(oldData[field] || 0);
            const newVal = Number(patient[field] || 0);
            if (oldVal !== newVal) {
                changes[field] = { old: oldVal, new: newVal };
                hasFinancialChanges = true;
            }
        });

        if (hasFinancialChanges) {
            const logAudit = require('../utils/auditLogger');
            await logAudit({
                userId: req.user?.id || 1, // Fallback to 1 if no user (shouldn't happen in protected route)
                action: 'UPDATE_PATIENT_FINANCIALS',
                tableName: 'patients',
                recordId: patient.id,
                changes: changes,
                req
            });
        }

        res.json(patient);
    } catch (error) {
        console.error('Update patient error:', error);
        res.status(500).json({ error: 'Failed to update patient' });
    }
};

// Delete patient
const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Optional: Delete photo file when deleting patient
        if (patient.photoUrl) {
            const photoPath = path.join(__dirname, '..', patient.photoUrl);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        await patient.destroy();
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        console.error('Delete patient error:', error);
        res.status(500).json({ error: 'Failed to delete patient' });
    }
};

// Merge patients
const mergePatients = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { primaryId, duplicateId } = req.body;

        if (!primaryId || !duplicateId) {
            return res.status(400).json({ error: 'Primary and Duplicate patient IDs are required' });
        }

        if (primaryId === duplicateId) {
            return res.status(400).json({ error: 'Cannot merge a patient into themselves' });
        }

        const primaryPatient = await Patient.findByPk(primaryId, { transaction: t });
        const duplicatePatient = await Patient.findByPk(duplicateId, { transaction: t });

        if (!primaryPatient || !duplicatePatient) {
            await t.rollback();
            return res.status(404).json({ error: 'One or both patients not found' });
        }

        // Models to update references for
        const relatedModels = [
            OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill,
            TheatreBill, MaternityBill, SpecialistClinicBill,
            NHIMAClaim, Payment, LabRequest
        ];

        // Update all related records
        for (const Model of relatedModels) {
            if (Model) {
                await Model.update(
                    { patientId: primaryId },
                    { where: { patientId: duplicateId }, transaction: t }
                );
            }
        }

        // Handle photo transfer if primary has none
        if (!primaryPatient.photoUrl && duplicatePatient.photoUrl) {
            await primaryPatient.update({ photoUrl: duplicatePatient.photoUrl }, { transaction: t });
        }

        // Delete the duplicate patient
        await duplicatePatient.destroy({ transaction: t });

        await t.commit();
        res.json({ message: 'Patients merged successfully', primaryPatient });

    } catch (error) {
        await t.rollback();
        console.error('Merge patients error:', error);
        res.status(500).json({ error: 'Failed to merge patients', details: error.message });
    }
};

module.exports = {
    getAllPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    mergePatients
};
