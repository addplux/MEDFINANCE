const { NHIMAClaim, CorporateAccount, Scheme, SchemeInvoice, Patient, User, OPDBill, PharmacyBill, LabBill, RadiologyBill, Service, Payment, sequelize } = require('../models');
const { Op } = require('sequelize');
const { postSchemeInvoice } = require('../utils/glPoster');

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

// Get single scheme details
const getSchemeById = async (req, res) => {
    try {
        const { id } = req.params;
        const scheme = await Scheme.findByPk(id);
        if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
        res.json(scheme);
    } catch (error) {
        console.error('Get scheme error:', error);
        res.status(500).json({ error: 'Failed to get scheme' });
    }
};

// Get scheme statement (bills)
const getSchemeStatement = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        const scheme = await Scheme.findByPk(id);
        if (!scheme) return res.status(404).json({ error: 'Scheme not found' });

        // Filter bills by date and scheme payment
        const where = {
            // paymentMethod: ['insurance', 'credit'] // simplistic check
        };

        if (startDate && endDate) {
            where.billDate = { [Op.between]: [startDate, endDate] };
        }

        // Find bills for patients appearing in this scheme
        const bills = await OPDBill.findAll({
            where,
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    where: { schemeId: id }, // Only bills for patients in this scheme
                    attributes: ['id', 'firstName', 'lastName', 'patientNumber', 'gender', 'nhimaNumber']
                },
                {
                    model: Service,
                    as: 'service',
                    attributes: ['serviceName']
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['firstName', 'lastName']
                }
            ],
            order: [['billDate', 'DESC']]
        });

        res.json({ scheme, bills });
    } catch (error) {
        console.error('Get scheme statement error:', error);
        res.status(500).json({ error: 'Failed to generate scheme statement' });
    }
};

// Get scheme members
const getSchemeMembers = async (req, res) => {
    try {
        const { id } = req.params; // Scheme ID
        const { search, status } = req.query;

        const where = { schemeId: id };

        if (status) where.memberStatus = status;

        if (search) {
            where[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { policyNumber: { [Op.iLike]: `%${search}%` } },
                { nrc: { [Op.iLike]: `%${search}%` } },
                { patientNumber: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const members = await Patient.findAll({
            where,
            order: [
                ['policyNumber', 'ASC'],
                ['memberSuffix', 'ASC'],
                ['createdAt', 'DESC']
            ]
        });

        res.json(members);
    } catch (error) {
        console.error('Get scheme members error:', error);
        res.status(500).json({ error: 'Failed to get scheme members' });
    }
};

// Get family ledger (Running Balance Statement)
const getFamilyLedger = async (req, res) => {
    try {
        const { policyNumber } = req.params;
        const { startDate, endDate } = req.query;

        if (!policyNumber) return res.status(400).json({ error: 'Policy number is required' });

        // 1. Get all family members matching this policy
        const members = await Patient.findAll({
            where: { policyNumber },
            attributes: ['id', 'firstName', 'lastName', 'memberRank', 'memberSuffix', 'patientNumber', 'nrc', 'memberStatus']
        });

        if (members.length === 0) {
            return res.json({ members: [], transactions: [], balance: 0, broughtForward: 0 });
        }

        const patientIds = members.map(m => m.id);
        const memberMap = members.reduce((acc, m) => {
            acc[m.id] = m;
            return acc;
        }, {});

        // 2. Fetch ALL Bills & Payments (no date filter yet, so we get correct running balance)
        // We will filter by date AFTER calculating running balance to determine 'brought forward'

        const opdBills = await OPDBill.findAll({
            where: { patientId: { [Op.in]: patientIds } },
            include: [{ model: Service, as: 'service' }]
        });

        const pharmacyBills = await PharmacyBill.findAll({
            where: { patientId: { [Op.in]: patientIds } }
        });

        const payments = await Payment.findAll({
            where: { patientId: { [Op.in]: patientIds } }
        });

        // 4. Combine and Sort
        let allTransactions = [];

        // Map OPD Bills
        opdBills.forEach(bill => {
            const member = memberMap[bill.patientId];
            const suffix = member.memberSuffix || (member.memberRank === 'principal' ? 1 : 2);
            allTransactions.push({
                date: bill.billDate,
                type: 'bill',
                ref: bill.billNumber,
                description: `*${suffix} - ${member.firstName} - ${bill.service?.serviceName || 'Service'}`,
                debit: Number(bill.netAmount),
                credit: 0
            });
        });

        // Map Pharmacy Bills
        pharmacyBills.forEach(bill => {
            const member = memberMap[bill.patientId];
            const suffix = member.memberSuffix || '?';
            allTransactions.push({
                date: bill.billDate,
                type: 'bill',
                ref: bill.billNumber,
                description: `*${suffix} - ${member.firstName} - Drugs/Medication`,
                debit: Number(bill.calculateTotal ? bill.calculateTotal() : bill.totalAmount),
                credit: 0
            });
        });

        // Map Payments
        payments.forEach(doc => {
            const member = memberMap[doc.patientId];
            const suffix = member.memberSuffix || '?';
            allTransactions.push({
                date: doc.paymentDate,
                type: 'payment',
                ref: doc.receiptNumber,
                description: `*${suffix} - ${member.firstName} - Payment (${doc.paymentMethod})`,
                debit: 0,
                credit: Number(doc.amount)
            });
        });

        // Sort by date
        allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        // 5. Calculate Running Balance
        let runningBalance = 0;
        allTransactions = allTransactions.map(t => {
            runningBalance += (t.debit - t.credit);
            return { ...t, balance: runningBalance };
        });

        // 6. Filter by Date Range and handle Brought Forward
        let finalTransactions = allTransactions;
        let broughtForward = 0;

        if (startDate) {
            const start = new Date(startDate);
            // Find first transaction on or after start date
            const splitIndex = allTransactions.findIndex(t => new Date(t.date) >= start);

            if (splitIndex > 0) {
                broughtForward = allTransactions[splitIndex - 1].balance;
                finalTransactions = allTransactions.slice(splitIndex);
            } else if (splitIndex === -1) {
                // If all transactions are before start date, check if there are any transactions
                if (allTransactions.length > 0) {
                    broughtForward = allTransactions[allTransactions.length - 1].balance;
                }
                finalTransactions = [];
            } else {
                // splitIndex === 0, all transactions are after start date
                broughtForward = 0;
            }
        }

        if (endDate) {
            const end = new Date(endDate);
            finalTransactions = finalTransactions.filter(t => new Date(t.date) <= end);
        }

        const principal = members.find(m => m.memberRank === 'principal') || members[0];

        res.json({
            principal,
            members,
            broughtForward,
            transactions: finalTransactions,
            finalBalance: runningBalance // Current total balance regardless of view
        });

    } catch (error) {
        console.error('Get family ledger error:', error);
        res.status(500).json({ error: 'Failed to generate family ledger' });
    }
};



// Generate Monthly Scheme Invoice
const generateMonthlyInvoice = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { schemeId, month, year } = req.body; // month is 1-12

        if (!schemeId || !month || !year) {
            return res.status(400).json({ error: 'Scheme ID, month, and year are required' });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        // Fetch uninvoiced bills
        // 1. OPD Bills
        const opdBills = await OPDBill.findAll({
            where: {
                schemeInvoiceId: null,
                billDate: { [Op.between]: [startDate, endDate] }
            },
            include: [
                { model: Patient, where: { schemeId }, attributes: ['id'] },
                { model: Service, as: 'service' }
            ]
        });

        // 2. Pharmacy Bills
        const pharmacyBills = await PharmacyBill.findAll({
            where: {
                schemeInvoiceId: null,
                billDate: { [Op.between]: [startDate, endDate] }
            },
            include: [
                { model: Patient, where: { schemeId }, attributes: ['id'] },
            ]
        });

        // 3. Lab Bills
        const labBills = await LabBill.findAll({
            where: {
                schemeInvoiceId: null,
                billDate: { [Op.between]: [startDate, endDate] }
            },
            include: [
                { model: Patient, where: { schemeId }, attributes: ['id'] },
            ]
        });

        // 4. Radiology Bills
        const radiologyBills = await RadiologyBill.findAll({
            where: {
                schemeInvoiceId: null,
                billDate: { [Op.between]: [startDate, endDate] }
            },
            include: [
                { model: Patient, where: { schemeId }, attributes: ['id'] },
            ]
        });

        const totalOPD = opdBills.reduce((sum, b) => Number(sum) + Number(b.netAmount), 0);
        const totalPharmacy = pharmacyBills.reduce((sum, b) => Number(sum) + Number(b.netAmount), 0);
        const totalLab = labBills.reduce((sum, b) => Number(sum) + Number(b.netAmount), 0);
        const totalRadiology = radiologyBills.reduce((sum, b) => Number(sum) + Number(b.netAmount), 0);

        const grandTotal = totalOPD + totalPharmacy + totalLab + totalRadiology;

        if (grandTotal === 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'No uninvoiced bills found for this period' });
        }

        // Generate Invoice Number
        const scheme = await Scheme.findByPk(schemeId);
        const count = await SchemeInvoice.count() + 1;
        const invoiceNumber = `INV-${scheme.schemeCode}-${year}${String(month).padStart(2, '0')}-${String(count).padStart(3, '0')}`;

        // Create Invoice
        const invoice = await SchemeInvoice.create({
            invoiceNumber,
            schemeId,
            periodStart: startDate,
            periodEnd: endDate,
            totalAmount: grandTotal,
            status: 'draft',
            generatedBy: req.user?.id || 1
        }, { transaction });

        // Update Bills with Invoice ID
        if (opdBills.length > 0) {
            await OPDBill.update({ schemeInvoiceId: invoice.id }, {
                where: { id: { [Op.in]: opdBills.map(b => b.id) } },
                transaction
            });
        }
        if (pharmacyBills.length > 0) {
            await PharmacyBill.update({ schemeInvoiceId: invoice.id }, {
                where: { id: { [Op.in]: pharmacyBills.map(b => b.id) } },
                transaction
            });
        }
        if (labBills.length > 0) {
            await LabBill.update({ schemeInvoiceId: invoice.id }, {
                where: { id: { [Op.in]: labBills.map(b => b.id) } },
                transaction
            });
        }
        if (radiologyBills.length > 0) {
            await RadiologyBill.update({ schemeInvoiceId: invoice.id }, {
                where: { id: { [Op.in]: radiologyBills.map(b => b.id) } },
                transaction
            });
        }


        // Post to General Ledger
        await postSchemeInvoice(invoice, transaction);

        await transaction.commit();
        res.status(201).json(invoice);

    } catch (error) {
        if (transaction.finished !== 'commit') await transaction.rollback();
        console.error('Generate scheme invoice error:', error);
        res.status(500).json({ error: 'Failed to generate scheme invoice' });
    }
};

// Get Scheme Invoices List
const getSchemeInvoices = async (req, res) => {
    try {
        const { id } = req.params; // schemeId
        const invoices = await SchemeInvoice.findAll({
            where: { schemeId: id },
            order: [['createdAt', 'DESC']]
        });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

// Get Single Invoice with Matrix Data
const getSchemeInvoice = async (req, res) => {
    try {
        const { id } = req.params; // invoiceId
        const invoice = await SchemeInvoice.findByPk(id, {
            include: [{ model: Scheme, as: 'scheme' }]
        });

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        // Fetch bills linked to this invoice
        const opdBills = await OPDBill.findAll({
            where: { schemeInvoiceId: id },
            include: [
                { model: Patient, as: 'patient' },
                { model: Service, as: 'service' }
            ]
        });

        const pharmacyBills = await PharmacyBill.findAll({
            where: { schemeInvoiceId: id },
            include: [{ model: Patient, as: 'patient' }]
        });

        const labBills = await LabBill.findAll({
            where: { schemeInvoiceId: id },
            include: [{ model: Patient, as: 'patient' }]
        });

        const radiologyBills = await RadiologyBill.findAll({
            where: { schemeInvoiceId: id },
            include: [{ model: Patient, as: 'patient' }]
        });

        const matrix = {}; // Key: "yyyy-mm-dd_patientId"

        const addToMatrix = (bill, type, amount, description) => {
            if (!bill.patient) return; // robustness
            const date = bill.billDate;
            const patient = bill.patient;
            const key = `${date}_${patient.id}`;

            if (!matrix[key]) {
                matrix[key] = {
                    date,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    manNumber: patient.schemeNumber || patient.patientNumber, // Using schemeNumber as MAN NO
                    policyNumber: patient.policyNumber,
                    consult: 0,
                    drugs: 0,
                    lab: 0,
                    radiology: 0,
                    other: 0,
                    total: 0
                };
            }

            if (['consult', 'drugs', 'lab', 'radiology'].includes(type)) {
                matrix[key][type] += Number(amount);
            } else {
                matrix[key]['other'] += Number(amount);
            }

            matrix[key].total += Number(amount);
        };

        opdBills.forEach(b => {
            let type = 'other';
            if (b.service) { // Map service category
                if (b.service.category === 'opd') type = 'consult';
                else if (b.service.category === 'laboratory') type = 'lab';
                else if (b.service.category === 'radiology') type = 'radiology';
                else if (b.service.category === 'pharmacy') type = 'drugs';
                else type = 'other';
            }
            addToMatrix(b, type, b.netAmount, b.service?.serviceName);
        });

        pharmacyBills.forEach(b => {
            addToMatrix(b, 'drugs', b.netAmount, 'Medication');
        });

        labBills.forEach(b => {
            addToMatrix(b, 'lab', b.netAmount, b.testName);
        });

        radiologyBills.forEach(b => {
            addToMatrix(b, 'radiology', b.netAmount, b.scanType);
        });

        const rows = Object.values(matrix).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate Column Totals
        const totals = {
            consult: rows.reduce((s, r) => s + r.consult, 0),
            drugs: rows.reduce((s, r) => s + r.drugs, 0),
            lab: rows.reduce((s, r) => s + r.lab, 0),
            radiology: rows.reduce((s, r) => s + r.radiology, 0),
            other: rows.reduce((s, r) => s + r.other, 0),
            grandTotal: rows.reduce((s, r) => s + r.total, 0)
        };

        res.json({
            invoice,
            rows,
            totals
        });

    } catch (error) {
        console.error('Get invoice details error:', error);
        res.status(500).json({ error: 'Failed to fetch invoice details' });
    }
};


// Import Scheme Members (Bulk)
const importSchemeMembers = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params; // Scheme ID
        const { members } = req.body; // Array of member objects

        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ error: 'No members data provided' });
        }

        const scheme = await Scheme.findByPk(id);
        if (!scheme) {
            return res.status(404).json({ error: 'Scheme not found' });
        }

        let addedCount = 0;
        let updatedCount = 0;
        let failedCount = 0;
        const errors = [];

        for (const member of members) {
            try {
                // Validate required fields
                if (!member.firstName || !member.lastName || !member.policyNumber) {
                    failedCount++;
                    errors.push(`Missing required fields for ${member.firstName} ${member.lastName}`);
                    continue;
                }

                // Check if patient exists (by Policy Number + Scheme, or NRC)
                // Priority: Policy Number within this Scheme
                let patient = await Patient.findOne({
                    where: {
                        policyNumber: member.policyNumber,
                        schemeId: id
                    },
                    transaction: t
                });

                // If not found, check by NHIMA/NRC if provided
                if (!patient && member.nrc) {
                    patient = await Patient.findOne({ where: { nrc: member.nrc }, transaction: t });
                }

                // Determine paymentMethod based on Scheme Type
                let paymentMethod = 'scheme';
                if (scheme.schemeType === 'corporate') {
                    paymentMethod = 'corporate';
                }

                const patientData = {
                    firstName: member.firstName,
                    lastName: member.lastName,
                    dateOfBirth: member.dateOfBirth || new Date('1990-01-01'), // Default if missing
                    gender: member.gender ? member.gender.toLowerCase() : 'other',
                    policyNumber: member.policyNumber,
                    schemeId: id,
                    paymentMethod,
                    memberRank: member.rank || 'principal',
                    memberSuffix: member.suffix || 1,
                    phone: member.phone,
                    email: member.email,
                    nrc: member.nrc,
                    address: member.address,
                    memberStatus: 'active'
                };

                if (patient) {
                    // Update
                    await patient.update(patientData, { transaction: t });
                    updatedCount++;
                } else {
                    // Create
                    // Ensure unique patientNumber
                    const count = await Patient.count({ transaction: t });
                    const patientNumber = `P${String(count + addedCount + 1).padStart(6, '0')}`;

                    await Patient.create({
                        ...patientData,
                        patientNumber,
                        balance: member.balance ? parseFloat(member.balance) : 0.00
                    }, { transaction: t });
                    addedCount++;
                }

            } catch (err) {
                console.error(`Failed to import member row:`, err);
                failedCount++;
                errors.push(`Error for ${member.firstName || 'Unknown'}: ${err.message}`);
            }
        }

        await t.commit();

        res.json({
            message: 'Import processed',
            summary: {
                total: members.length,
                added: addedCount,
                updated: updatedCount,
                failed: failedCount,
                errors
            }
        });

    } catch (error) {
        await t.rollback();
        console.error('Import members error:', error);
        res.status(500).json({ error: 'Failed to import members' });
    }
};

module.exports = {
    getAllNHIMAClaims,
    createNHIMAClaim,
    updateNHIMAClaim,
    getAllCorporateAccounts,
    createCorporateAccount,
    getAllSchemes,
    createScheme,
    getSchemeById,
    getSchemeStatement,
    getSchemeMembers,
    getFamilyLedger,
    generateMonthlyInvoice,
    getSchemeInvoice,
    getSchemeInvoices,
    importSchemeMembers
};
