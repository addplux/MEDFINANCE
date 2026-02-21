const {
    Patient, OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill,
    TheatreBill, MaternityBill, SpecialistClinicBill, NHIMAClaim,
    Payment, LabRequest, Visit, sequelize
} = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { updatePatientBalance } = require('../utils/balanceUpdater');

// Get all patients
const getAllPatients = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, paymentMethod } = req.query;
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

        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }

        const { count, rows } = await Patient.findAndCountAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM visits AS v
                            WHERE v.patient_id = "Patient".id
                        )`),
                        'totalVisits'
                    ]
                ]
            },
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
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const visitCount = await Visit.count({ where: { patientId: req.params.id } });
        const patientData = patient.toJSON();
        patientData.totalVisits = visitCount;

        res.json(patientData);
    } catch (error) {
        console.error('Get patient error:', error);
        res.status(500).json({ error: 'Failed to get patient' });
    }
};

// Create patient
const createPatient = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            firstName, lastName, dateOfBirth, gender, phone, email, address,
            nhimaNumber, paymentMethod, costCategory, staffId, serviceId, registeredService, ward,
            emergencyContact, emergencyPhone, nrc, patientType, schemeId, initialDeposit
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !dateOfBirth || !gender) {
            await t.rollback();
            return res.status(400).json({ error: 'First name, last name, date of birth, and gender are required' });
        }

        // Generate patient number
        const patientCount = await Patient.count({ transaction: t });
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
            registeredService: registeredService || null,
            ward: ward || null,
            emergencyPhone,
            nrc,
            patientType: patientType || 'opd',
            schemeId: schemeId || null,
            photoUrl
        }, { transaction: t });

        // Handle initial deposit if present
        if (initialDeposit && !isNaN(Number(initialDeposit)) && Number(initialDeposit) > 0) {
            // Generate receipt number
            const paymentCount = await Payment.count({ transaction: t });
            const receiptNumber = `RCP${String(paymentCount + 1).padStart(6, '0')}`;

            await Payment.create({
                receiptNumber,
                patientId: patient.id,
                amount: Number(initialDeposit),
                paymentMethod: 'cash',
                paymentDate: new Date(),
                notes: 'Initial registration fee / deposit',
                receivedBy: req.user?.id || 1 // Fallback for testing
            }, { transaction: t });

            // Update balance
            await updatePatientBalance(patient.id, t);
        }

        await t.commit();
        res.status(201).json(patient);
    } catch (error) {
        await t.rollback();
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

        // Convert empty strings to null for optional foreign keys and enums
        if (updateData.staffId === '') updateData.staffId = null;
        if (updateData.serviceId === '') updateData.serviceId = null;
        if (updateData.schemeId === '') updateData.schemeId = null;
        if (updateData.ward === '') updateData.ward = null;
        if (updateData.registeredService === '') updateData.registeredService = null;

        // Ensure staffId is only set if paymentMethod is staff
        if (updateData.paymentMethod && updateData.paymentMethod !== 'staff') {
            updateData.staffId = null;
        }

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

// Get patient visit history (all billing records)
const getVisitHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient.findByPk(id);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const where = { patientId: id };

        const [opd, ipd, pharmacy, lab, radiology, theatre, maternity, specialist] = await Promise.all([
            OPDBill.findAll({ where, order: [['createdAt', 'DESC']], raw: true }).catch(() => []),
            IPDBill.findAll({ where, order: [['createdAt', 'DESC']], raw: true }).catch(() => []),
            PharmacyBill.findAll({ where, order: [['createdAt', 'DESC']], raw: true }).catch(() => []),
            LabBill.findAll({ where, order: [['createdAt', 'DESC']], raw: true }).catch(() => []),
            RadiologyBill.findAll({ where, order: [['createdAt', 'DESC']], raw: true }).catch(() => []),
            TheatreBill.findAll({ where, order: [['createdAt', 'DESC']], raw: true }).catch(() => []),
            MaternityBill.findAll({ where, order: [['createdAt', 'DESC']], raw: true }).catch(() => []),
            SpecialistClinicBill.findAll({ where, order: [['createdAt', 'DESC']], raw: true }).catch(() => []),
        ]);

        const tag = (records, type) => records.map(r => ({ ...r, visitType: type }));

        const allVisits = [
            ...tag(opd, 'OPD'),
            ...tag(ipd, 'IPD'),
            ...tag(pharmacy, 'Pharmacy'),
            ...tag(lab, 'Laboratory'),
            ...tag(radiology, 'Radiology'),
            ...tag(theatre, 'Theatre'),
            ...tag(maternity, 'Maternity'),
            ...tag(specialist, 'Specialist Clinic'),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ patient, visits: allVisits, total: allVisits.length });
    } catch (error) {
        console.error('Get visit history error:', error);
        res.status(500).json({ error: 'Failed to get visit history', details: error.message });
    }
};



// Topup Prepaid Balance
const topupPrepaidBalance = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        if (patient.paymentMethod !== 'private_prepaid') {
            return res.status(400).json({ error: 'Patient is not on a private prepaid scheme' });
        }

        const { amount } = req.body;
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ error: 'A valid top-up amount is required' });
        }

        const { addPrepaidCredit } = require('../utils/balanceUpdater');
        const newBalance = await addPrepaidCredit(patient.id, Number(amount));

        const updated = await Patient.findByPk(patient.id);
        res.json({ message: 'Balance topped up successfully', balance: newBalance, prepaidCredit: updated.prepaidCredit });
    } catch (error) {
        console.error('Topup error:', error);
        res.status(500).json({ error: 'Failed to top up balance', details: error.message });
    }
};

module.exports = {
    getAllPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    mergePatients,
    getVisitHistory,
    topupPrepaidBalance
};
