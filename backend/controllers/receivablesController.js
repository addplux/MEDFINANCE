const { NHIMAClaim, CorporateAccount, Scheme, Patient, User, sequelize } = require('../models');

// ========== NHIMA Claims ==========

// Get all NHIMA claims
const getAllNHIMAClaims = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const { count, rows } = await NHIMAClaim.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [
                { association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber', 'nhimaNumber'] },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Get NHIMA claims error:', error);
        res.status(500).json({ error: 'Failed to get NHIMA claims' });
    }
};

// Create NHIMA claim
const createNHIMAClaim = async (req, res) => {
    try {
        const { patientId, claimAmount, submissionDate, notes } = req.body;

        if (!patientId || !claimAmount) {
            return res.status(400).json({ error: 'Patient and claim amount are required' });
        }

        // Get patient to verify NHIMA number
        const patient = await Patient.findByPk(patientId);
        if (!patient || !patient.nhimaNumber) {
            return res.status(400).json({ error: 'Patient must have a valid NHIMA number' });
        }

        // Generate claim number
        const claimCount = await NHIMAClaim.count();
        const claimNumber = `NHIMA${String(claimCount + 1).padStart(6, '0')}`;

        const claim = await NHIMAClaim.create({
            claimNumber,
            patientId,
            nhimaNumber: patient.nhimaNumber,
            claimAmount,
            submissionDate: submissionDate || new Date(),
            notes,
            createdBy: req.user.id
        });

        const createdClaim = await NHIMAClaim.findByPk(claim.id, {
            include: [
                { association: 'patient' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json(createdClaim);
    } catch (error) {
        console.error('Create NHIMA claim error:', error);
        res.status(500).json({ error: 'Failed to create NHIMA claim' });
    }
};

// Update NHIMA claim
const updateNHIMAClaim = async (req, res) => {
    try {
        const claim = await NHIMAClaim.findByPk(req.params.id);

        if (!claim) {
            return res.status(404).json({ error: 'NHIMA claim not found' });
        }

        await claim.update(req.body);

        const updatedClaim = await NHIMAClaim.findByPk(claim.id, {
            include: [
                { association: 'patient' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json(updatedClaim);
    } catch (error) {
        console.error('Update NHIMA claim error:', error);
        res.status(500).json({ error: 'Failed to update NHIMA claim' });
    }
};

// ========== Corporate Accounts ==========

// Get all corporate accounts
const getAllCorporateAccounts = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const { count, rows } = await CorporateAccount.findAndCountAll({
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
        console.error('Get corporate accounts error:', error);
        res.status(500).json({ error: 'Failed to get corporate accounts' });
    }
};

// Create corporate account
const createCorporateAccount = async (req, res) => {
    try {
        const { companyName, contactPerson, phone, email, address, creditLimit, paymentTerms, notes } = req.body;

        if (!companyName) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        // Generate account number
        const accountCount = await CorporateAccount.count();
        const accountNumber = `CORP${String(accountCount + 1).padStart(6, '0')}`;

        const account = await CorporateAccount.create({
            accountNumber,
            companyName,
            contactPerson,
            phone,
            email,
            address,
            creditLimit: creditLimit || 0,
            paymentTerms,
            notes
        });

        res.status(201).json(account);
    } catch (error) {
        console.error('Create corporate account error:', error);
        res.status(500).json({ error: 'Failed to create corporate account' });
    }
};

// ========== Schemes ==========

// Get all schemes
const getAllSchemes = async (req, res) => {
    try {
        const { status } = req.query;

        const where = {};
        if (status) where.status = status;

        const schemes = await Scheme.findAll({
            where,
            order: [['schemeName', 'ASC']]
        });

        res.json(schemes);
    } catch (error) {
        console.error('Get schemes error:', error);
        res.status(500).json({ error: 'Failed to get schemes' });
    }
};

// Create scheme
const createScheme = async (req, res) => {
    try {
        const { schemeName, schemeType, discountRate, contactPerson, phone, email, notes } = req.body;

        if (!schemeName || !schemeType) {
            return res.status(400).json({ error: 'Scheme name and type are required' });
        }

        // Generate scheme code
        const schemeCount = await Scheme.count();
        const schemeCode = `SCH${String(schemeCount + 1).padStart(4, '0')}`;

        const scheme = await Scheme.create({
            schemeCode,
            schemeName,
            schemeType,
            discountRate: discountRate || 0,
            contactPerson,
            phone,
            email,
            notes
        });

        res.status(201).json(scheme);
    } catch (error) {
        console.error('Create scheme error:', error);
        res.status(500).json({ error: 'Failed to create scheme' });
    }
};

module.exports = {
    getAllNHIMAClaims,
    createNHIMAClaim,
    updateNHIMAClaim,
    getAllCorporateAccounts,
    createCorporateAccount,
    getAllSchemes,
    createScheme
};
