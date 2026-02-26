const {
    Patient, OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill,
    TheatreBill, MaternityBill, SpecialistClinicBill,
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
            paymentMethod, costCategory, staffId, serviceId, registeredService, ward,
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
            Payment, LabRequest
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

// Bulk Upload Prepaid Ledger
const uploadPrepaidLedger = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        if (!req.file) {
            await t.rollback();
            return res.status(400).json({ error: 'No Excel file provided.' });
        }

        const xlsx = require('xlsx');
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let currentSchemeCostCategory = 'standard';
        let currentMember = null;
        let pendingName = null;
        const membersToCreate = [];

        const txKeywords = ['BAL B/F', 'BALANCE', 'MEMBERSHIP', 'CONSULTATION', 'PHARMACY', 'LABORATORY', 'X-RAY', 'CASH', 'PAYMENT', 'RECEIPT', 'DRUGS', 'B/F', 'BROUGHT FORWARD', 'CLIENTS', 'DETAILS', 'LEDGER', 'DATE'];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const rowStr = row.map(cell => String(cell || '').trim().toUpperCase()).join(' ');

            // Detect Scheme Category
            if (rowStr.includes('HIGH COST')) currentSchemeCostCategory = 'high_cost';
            if (rowStr.includes('LOW COST')) currentSchemeCostCategory = 'low_cost';

            // Filter non-empty cells
            const cells = row.map(c => String(c || '').trim()).filter(c => c);
            if (cells.length === 0) continue;

            // Try to detect a Name if it's not a strong transaction row
            const candidateTextCells = cells.filter(c => {
                const cleanC = c.replace(/,/g, '');
                const isNum = !isNaN(Number(cleanC));
                const isDate = /^\d{2}[\.\/]\d{2}[\.\/]\d{2,4}$/.test(c);
                return !isNum && !isDate;
            });

            if (candidateTextCells.length > 0) {
                const candidate = candidateTextCells[0];
                const candidateUpper = candidate.toUpperCase();

                const isTx = txKeywords.some(kw => candidateUpper.includes(kw));
                const isSchemeNo = candidateUpper.includes('SCH');

                // If it's not a transaction keyword, not a number, and not a header, not a SCH NO
                if (!isTx && !isSchemeNo && !candidateUpper.includes('HIGH COST LEDGERS FOR SCHEME MEMBERS') && !candidateUpper.includes('LOW COST LEDGERS FOR SCHEME MEMBERS') && candidate.length > 2) {
                    // It's likely a Name
                    pendingName = candidate;
                }
            }

            // Detect Scheme No.
            const schMatch = rowStr.match(/SCH\.?\s*NO\.?\s*([A-Z0-9_-]+)/);
            if (schMatch) {
                if (currentMember) {
                    membersToCreate.push(currentMember);
                }

                currentMember = {
                    schemeNo: schMatch[1],
                    name: pendingName || 'Unknown',
                    balance: 0,
                    costCategory: currentSchemeCostCategory
                };
                pendingName = null; // Reset pending name
                continue;
            }

            // If we have a currentMember, look for balances
            if (currentMember) {
                // Find right-most valid number for balance
                let rowBalance = null;
                for (let j = row.length - 1; j >= 0; j--) {
                    const val = String(row[j] || '').replace(/,/g, '').trim();
                    if (val && !isNaN(Number(val)) && !/^\d{2}[\.\/]\d{2}[\.\/]\d{2,4}$/.test(val)) {
                        rowBalance = Number(val);
                        break;
                    }
                }

                if (rowBalance !== null) {
                    currentMember.balance = rowBalance;
                }
            }
        }

        if (currentMember && currentMember.name) {
            membersToCreate.push(currentMember);
        }

        if (membersToCreate.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'No members could be parsed from the uploaded Excel file.' });
        }

        let patientCount = await Patient.count({ transaction: t });
        const createdPatients = [];

        for (const member of membersToCreate) {
            const nameParts = member.name.split(' ');
            let firstName = nameParts[0] || 'Unknown';
            let lastName = nameParts.slice(1).join(' ') || 'Unknown';

            // Truncate names to fit DB length
            firstName = firstName.substring(0, 50);
            lastName = lastName.substring(0, 50);

            // Map Scheme No to Patient No as requested
            let targetPatientNumber = member.schemeNo;
            const existing = await Patient.findOne({ where: { patientNumber: targetPatientNumber.substring(0, 20) }, transaction: t });
            if (existing) {
                patientCount++;
                targetPatientNumber = `${member.schemeNo.substring(0, 14)}-${patientCount}`;
            } else {
                targetPatientNumber = targetPatientNumber.substring(0, 20);
            }

            const patient = await Patient.create({
                patientNumber: targetPatientNumber,
                firstName,
                lastName,
                dateOfBirth: '1990-01-01', // Use string to prevent Sequelize Date object issues with DATEONLY
                gender: 'other', // Default
                paymentMethod: 'private_prepaid',
                costCategory: member.costCategory,
                patientType: 'opd',
                schemeId: req.body.schemeId ? Number(req.body.schemeId) : null,
                policyNumber: member.schemeNo.substring(0, 50), // Store in policy number as well
                balance: member.balance,
                prepaidCredit: member.balance > 0 ? member.balance : 0 // Fallback
            }, { transaction: t });

            createdPatients.push(patient);
        }

        await t.commit();
        res.status(200).json({
            message: `Successfully uploaded and registered ${createdPatients.length} members.`,
            count: createdPatients.length
        });
    } catch (error) {
        await t.rollback();
        console.error('Upload Ledger error:', error);
        res.status(500).json({ error: `Failed to process ledger upload: ${error.message || 'Unknown error'}`, details: error.message });
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
    topupPrepaidBalance,
    uploadPrepaidLedger
};
