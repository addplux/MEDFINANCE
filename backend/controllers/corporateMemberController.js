const xlsx = require('xlsx');
const { Patient, CorporateAccount, Scheme, User } = require('../models');

// Fetch members for a specific corporate account
exports.getCorporateMembers = async (req, res) => {
    try {
        const { accountId } = req.params;

        const members = await Patient.findAll({
            where: { paymentMethod: 'corporate' },
            include: [
                {
                    model: Scheme,
                    as: 'patientScheme',
                    // Assuming the Scheme has a foreign key or relation to CorporateAccount, 
                    // or the Patient links directly to the CorporateAccount via schemeId.
                    // For now, we will assume patients are filtered by the scheme tied to the corporate account.
                }
            ],
            // For true utilization, you'd aggregate bills. We use the updated 'balance' field.
            order: [['lastName', 'ASC']]
        });

        // Additional filtering may be needed depending on how CorporateAccount links to Scheme
        res.json(members);
    } catch (error) {
        console.error('Error fetching corporate members:', error);
        res.status(500).json({ error: 'Failed to fetch corporate members.' });
    }
};

// Upload and bulk-register members from Excel
exports.uploadMembers = async (req, res) => {
    const t = await Patient.sequelize.transaction();
    try {
        const { accountId, schemeId } = req.body; // Needs the target corporate scheme ID

        if (!req.file) {
            return res.status(400).json({ error: 'No Excel file provided.' });
        }

        if (!schemeId) {
            return res.status(400).json({ error: 'Scheme ID is required.' });
        }

        // Parse Excel
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        const normalizeKey = (key) => key.trim().toLowerCase();

        for (let i = 0; i < data.length; i++) {
            const rawRow = data[i];
            const row = {};
            for (let filterKey in rawRow) {
                row[normalizeKey(filterKey)] = rawRow[filterKey];
            }

            try {
                // Expected Columns (case insensitive): employee number, nrc, name
                const rawEmp = row['employee number'] || row['employee no'] || row['policy number'] || row['emp no'] || row['emp no.'];
                const employeeNo = rawEmp ? String(rawEmp).trim() : null;
                const nrc = row['nrc'] ? String(row['nrc']).trim() : null;
                const fullName = row['name'] || row['full name'] || row['employee name'];

                if (!employeeNo || !fullName) {
                    throw new Error(`Row ${i + 2}: Missing required fields (Employee number or Name).`);
                }

                // Split Name
                const nameParts = String(fullName).trim().split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || 'Unknown';

                // Check if patient exists
                let patient = await Patient.findOne({
                    where: {
                        patientNumber: employeeNo // Using patientNumber as Employee No for corporates, or policyNumber
                    },
                    transaction: t
                });

                if (!patient && nrc) {
                    patient = await Patient.findOne({ where: { nrc }, transaction: t });
                }

                if (patient) {
                    // Update existing
                    await patient.update({
                        paymentMethod: 'corporate',
                        schemeId: schemeId,
                        policyNumber: employeeNo,
                        memberRank: 'principal',
                        memberStatus: 'active'
                    }, { transaction: t });
                } else {
                    // Create new
                    await Patient.create({
                        patientNumber: employeeNo, // Generate or use Employee No
                        firstName,
                        lastName,
                        dateOfBirth: '1990-01-01', // Default, should ideally be in Excel
                        gender: 'other', // Default
                        nrc: nrc || null,
                        paymentMethod: 'corporate',
                        schemeId: schemeId,
                        policyNumber: employeeNo,
                        memberRank: 'principal',
                        memberStatus: 'active'
                    }, { transaction: t });
                }

                results.success++;
            } catch (rowError) {
                results.failed++;
                results.errors.push(rowError.message);
                console.warn(`Row ${i + 2} Import Error:`, rowError.message);
            }
        }

        await t.commit();
        res.json({ message: 'Upload complete.', results });

    } catch (error) {
        await t.rollback();
        console.error('Error uploading corporate members:', error);
        res.status(500).json({ error: 'Internal server error during upload.' });
    }
};

// Toggle member status
exports.updateMemberStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active' or 'suspended'

        if (!['active', 'suspended', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }

        const patient = await Patient.findByPk(id);
        if (!patient) {
            return res.status(404).json({ error: 'Member not found.' });
        }

        await patient.update({ memberStatus: status });

        res.json({ message: `Member status updated to ${status}.`, patient });
    } catch (error) {
        console.error('Error updating member status:', error);
        res.status(500).json({ error: 'Failed to update member status.' });
    }
};

// ── Add single patient to a corporate scheme manually ─────────────────────────
exports.addSingleMember = async (req, res) => {
    const t = await Patient.sequelize.transaction();
    try {
        const { accountId } = req.params;
        const { patientId, schemeId, policyNumber, memberRank, creditLimit } = req.body;

        if (!patientId || !schemeId) {
            return res.status(400).json({ error: 'patientId and schemeId are required.' });
        }

        const patient = await Patient.findByPk(patientId, { transaction: t });
        if (!patient) {
            await t.rollback();
            return res.status(404).json({ error: 'Patient not found.' });
        }

        // Enroll patient in the scheme
        await patient.update({
            paymentMethod: 'corporate',
            schemeId: schemeId,
            policyNumber: policyNumber || patient.patientNumber,
            memberRank: memberRank || 'principal',
            memberStatus: 'active',
            balance: creditLimit || patient.balance || 0
        }, { transaction: t });

        await t.commit();
        res.json({
            success: true,
            message: `${patient.firstName} ${patient.lastName} enrolled successfully.`,
            patient
        });
    } catch (error) {
        await t.rollback();
        console.error('Error adding single member:', error);
        res.status(500).json({ error: 'Failed to enroll member.' });
    }
};

// ── Corporate Self-Service Portal ─────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.portalLogin = async (req, res) => {
    try {
        const { schemeCode, pin } = req.body;
        if (!schemeCode || !pin) {
            return res.status(400).json({ error: 'Scheme code and PIN are required.' });
        }

        // Look up the scheme by code
        const scheme = await Scheme.findOne({ where: { schemeCode } });
        if (!scheme) {
            return res.status(401).json({ error: 'Invalid scheme code or PIN.' });
        }

        // Verify PIN (stored as portalPin on the scheme, hashed)
        const isValid = scheme.portalPin
            ? await bcrypt.compare(String(pin), scheme.portalPin)
            : String(pin) === '1234'; // fallback default during setup

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid scheme code or PIN.' });
        }

        const token = jwt.sign(
            { schemeId: scheme.id, schemeCode: scheme.schemeCode, type: 'corporate_portal' },
            process.env.JWT_SECRET || 'medfinance_secret',
            { expiresIn: '8h' }
        );

        res.json({ success: true, token, scheme: { id: scheme.id, name: scheme.schemeName, code: scheme.schemeCode } });
    } catch (error) {
        console.error('Portal login error:', error);
        res.status(500).json({ error: 'Portal login failed.' });
    }
};

const verifyPortalToken = (req) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) throw new Error('Unauthorized');
    const token = auth.split(' ')[1];
    return jwt.verify(token, process.env.JWT_SECRET || 'medfinance_secret');
};

exports.portalAccount = async (req, res) => {
    try {
        const { schemeId } = verifyPortalToken(req);
        const scheme = await Scheme.findByPk(schemeId, {
            attributes: ['id', 'schemeName', 'schemeCode', 'schemeType', 'creditLimit', 'usedCredit', 'status']
        });
        if (!scheme) return res.status(404).json({ error: 'Scheme not found.' });

        const creditLimit = parseFloat(scheme.creditLimit || 0);
        const usedCredit = parseFloat(scheme.usedCredit || 0);
        const balance = creditLimit - usedCredit;

        res.json({
            success: true,
            account: {
                schemeName: scheme.schemeName,
                schemeCode: scheme.schemeCode,
                creditLimit,
                usedCredit,
                balance: Math.max(0, balance),
                status: scheme.status
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.message === 'Unauthorized') {
            return res.status(401).json({ error: 'Unauthorized.' });
        }
        console.error('Portal account error:', error);
        res.status(500).json({ error: 'Failed to load account.' });
    }
};

exports.portalTransactions = async (req, res) => {
    try {
        const { schemeId } = verifyPortalToken(req);
        const { startDate, endDate, page = 1, limit = 50 } = req.query;
        const { Op } = Patient.sequelize.Sequelize;

        const where = { schemeId };
        // Get all scheme members
        const members = await Patient.findAll({ where: { schemeId }, attributes: ['id'] });
        const patientIds = members.map(m => m.id);

        // Query OPD bills for scheme patients
        const { OPDBill } = require('../models');
        const billWhere = { patientId: { [Op.in]: patientIds } };
        if (startDate) billWhere.createdAt = { ...(billWhere.createdAt || {}), [Op.gte]: new Date(startDate) };
        if (endDate) billWhere.createdAt = { ...(billWhere.createdAt || {}), [Op.lte]: new Date(endDate + 'T23:59:59') };

        const bills = await OPDBill.findAll({
            where: billWhere,
            include: [{ association: 'patient', attributes: ['firstName', 'lastName', 'patientNumber', 'policyNumber'] }],
            order: [['createdAt', 'DESC']],
            limit: Number(limit),
            offset: (Number(page) - 1) * Number(limit)
        });

        res.json({ success: true, data: bills });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.message === 'Unauthorized') {
            return res.status(401).json({ error: 'Unauthorized.' });
        }
        console.error('Portal transactions error:', error);
        res.status(500).json({ error: 'Failed to load transactions.' });
    }
};

