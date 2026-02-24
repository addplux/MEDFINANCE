const xlsx = require('xlsx');
const { CorporateAccount, Scheme, SchemeInvoice, Patient, User, OPDBill, PharmacyBill, LabBill, RadiologyBill, TheatreBill, MaternityBill, SpecialistClinicBill, Service, Payment, sequelize } = require('../models');
const { Op } = require('sequelize');
const { postSchemeInvoice } = require('../utils/glPoster');


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

        // DEBUG: Log all schemes and their types for debugging "no corporate scheme found" issue
        console.log('[DEBUG] All schemes from database:', JSON.stringify(schemes.map(s => ({ id: s.id, schemeName: s.schemeName, schemeType: s.schemeType, status: s.status }))));

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

// Update scheme
const updateScheme = async (req, res) => {
    try {
        const { id } = req.params;
        const scheme = await Scheme.findByPk(id);

        if (!scheme) {
            return res.status(404).json({ error: 'Scheme not found' });
        }

        await scheme.update(req.body);
        res.json(scheme);
    } catch (error) {
        console.error('Update scheme error:', error);
        res.status(500).json({ error: 'Failed to update scheme' });
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
                    attributes: ['id', 'firstName', 'lastName', 'patientNumber', 'gender']
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

        // 5. Theatre Bills
        const theatreBills = await TheatreBill.findAll({
            where: {
                schemeInvoiceId: null,
                procedureDate: { [Op.between]: [startDate, endDate] }
            },
            include: [
                { model: Patient, where: { schemeId }, attributes: ['id'] },
            ]
        });

        // 6. Maternity Bills
        const maternityBills = await MaternityBill.findAll({
            where: {
                schemeInvoiceId: null,
                createdAt: { [Op.between]: [startDate, endDate] } // Assuming creation date represents billing date if no specific delivery Date is set
            },
            include: [
                { model: Patient, where: { schemeId }, attributes: ['id'] },
            ]
        });

        // 7. Specialist Clinic Bills
        const specialistBills = await SpecialistClinicBill.findAll({
            where: {
                schemeInvoiceId: null,
                consultationDate: { [Op.between]: [startDate, endDate] }
            },
            include: [
                { model: Patient, where: { schemeId }, attributes: ['id'] },
            ]
        });

        const totalOPD = opdBills.reduce((sum, b) => Number(sum) + Number(b.netAmount), 0);
        const totalPharmacy = pharmacyBills.reduce((sum, b) => Number(sum) + Number(b.netAmount), 0);
        const totalLab = labBills.reduce((sum, b) => Number(sum) + Number(b.netAmount), 0);
        const totalRadiology = radiologyBills.reduce((sum, b) => Number(sum) + Number(b.netAmount), 0);
        const totalTheatre = theatreBills.reduce((sum, b) => Number(sum) + Number(b.totalAmount), 0);
        const totalMaternity = maternityBills.reduce((sum, b) => Number(sum) + Number(b.totalAmount), 0);
        const totalSpecialist = specialistBills.reduce((sum, b) => Number(sum) + Number(b.totalAmount), 0);

        const grandTotal = totalOPD + totalPharmacy + totalLab + totalRadiology + totalTheatre + totalMaternity + totalSpecialist;

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

        // Update Bills with Invoice ID and paymentStatus
        if (opdBills.length > 0) {
            await OPDBill.update({ schemeInvoiceId: invoice.id, paymentStatus: 'claimed' }, {
                where: { id: { [Op.in]: opdBills.map(b => b.id) } },
                transaction
            });
        }
        if (pharmacyBills.length > 0) {
            await PharmacyBill.update({ schemeInvoiceId: invoice.id, paymentStatus: 'claimed' }, {
                where: { id: { [Op.in]: pharmacyBills.map(b => b.id) } },
                transaction
            });
        }
        if (labBills.length > 0) {
            await LabBill.update({ schemeInvoiceId: invoice.id, paymentStatus: 'claimed' }, {
                where: { id: { [Op.in]: labBills.map(b => b.id) } },
                transaction
            });
        }
        if (radiologyBills.length > 0) {
            await RadiologyBill.update({ schemeInvoiceId: invoice.id, paymentStatus: 'claimed' }, {
                where: { id: { [Op.in]: radiologyBills.map(b => b.id) } },
                transaction
            });
        }
        if (theatreBills.length > 0) {
            await TheatreBill.update({ schemeInvoiceId: invoice.id, paymentStatus: 'claimed' }, {
                where: { id: { [Op.in]: theatreBills.map(b => b.id) } },
                transaction
            });
        }
        if (maternityBills.length > 0) {
            await MaternityBill.update({ schemeInvoiceId: invoice.id, paymentStatus: 'claimed' }, {
                where: { id: { [Op.in]: maternityBills.map(b => b.id) } },
                transaction
            });
        }
        if (specialistBills.length > 0) {
            await SpecialistClinicBill.update({ schemeInvoiceId: invoice.id, paymentStatus: 'claimed' }, {
                where: { id: { [Op.in]: specialistBills.map(b => b.id) } },
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

// Get All Active Services (For Dropdowns)
const getAllServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            where: { isActive: true },
            attributes: ['id', 'serviceName', 'department'],
            order: [['serviceName', 'ASC']]
        });
        res.json(services);
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
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
                    manNumber: patient.policyNumber || patient.patientNumber,
                    policyNumber: patient.policyNumber,
                    consultation: 0,
                    nursingCare: 0,
                    laboratory: 0,
                    radiology: 0,
                    dental: 0,
                    lodging: 0,
                    surgicals: 0,
                    drRound: 0,
                    food: 0,
                    physio: 0,
                    pharmacy: 0,
                    sundries: 0,
                    antenatal: 0,
                    other: 0,
                    total: 0
                };
            }

            const matrixItem = matrix[key];

            // Mapping logic for service types
            if (type === 'consult' || type === 'consultation') matrixItem.consultation += Number(amount);
            else if (type === 'nursing' || type === 'nursingCare') matrixItem.nursingCare += Number(amount);
            else if (type === 'lab' || type === 'laboratory') matrixItem.laboratory += Number(amount);
            else if (type === 'radiology') matrixItem.radiology += Number(amount);
            else if (type === 'dental') matrixItem.dental += Number(amount);
            else if (type === 'lodging') matrixItem.lodging += Number(amount);
            else if (type === 'surgicals') matrixItem.surgicals += Number(amount);
            else if (type === 'drRound') matrixItem.drRound += Number(amount);
            else if (type === 'food') matrixItem.food += Number(amount);
            else if (type === 'physio') matrixItem.physio += Number(amount);
            else if (type === 'drugs' || type === 'pharmacy') matrixItem.pharmacy += Number(amount);
            else if (type === 'sundries') matrixItem.sundries += Number(amount);
            else if (type === 'antenatal') matrixItem.antenatal += Number(amount);
            else matrixItem.other += Number(amount);

            matrixItem.total += Number(amount);
        };

        opdBills.forEach(b => {
            let type = 'other';
            if (b.service) {
                if (b.service.category === 'opd') type = 'consultation';
                else if (b.service.category === 'laboratory') type = 'laboratory';
                else if (b.service.category === 'radiology') type = 'radiology';
                else if (b.service.category === 'pharmacy') type = 'pharmacy';
                else type = 'other';
            }
            addToMatrix(b, type, b.netAmount, b.service?.serviceName);
        });

        pharmacyBills.forEach(b => {
            addToMatrix(b, 'pharmacy', b.netAmount, 'Medication');
        });

        labBills.forEach(b => {
            addToMatrix(b, 'laboratory', b.netAmount, b.testName);
        });

        radiologyBills.forEach(b => {
            addToMatrix(b, 'radiology', b.netAmount, b.scanType);
        });

        const rows = Object.values(matrix).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate Column Totals
        const totals = {
            consultation: rows.reduce((s, r) => s + r.consultation, 0),
            nursingCare: rows.reduce((s, r) => s + r.nursingCare, 0),
            laboratory: rows.reduce((s, r) => s + r.laboratory, 0),
            radiology: rows.reduce((s, r) => s + r.radiology, 0),
            dental: rows.reduce((s, r) => s + r.dental, 0),
            lodging: rows.reduce((s, r) => s + r.lodging, 0),
            surgicals: rows.reduce((s, r) => s + r.surgicals, 0),
            drRound: rows.reduce((s, r) => s + r.drRound, 0),
            food: rows.reduce((s, r) => s + r.food, 0),
            physio: rows.reduce((s, r) => s + r.physio, 0),
            pharmacy: rows.reduce((s, r) => s + r.pharmacy, 0),
            sundries: rows.reduce((s, r) => s + r.sundries, 0),
            antenatal: rows.reduce((s, r) => s + r.antenatal, 0),
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
// Import Scheme Members (Bulk)
const importSchemeMembers = async (req, res) => {
    // No outer transaction - we want partial success
    try {
        const { id } = req.params; // Scheme ID
        let members = req.body.members; // Might be JSON

        // If a file is uploaded, parse it
        if (req.file) {
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            members = xlsx.utils.sheet_to_json(worksheet);
            console.log(`Parsed ${members.length} members from uploaded file for Scheme ${id}`);
        }

        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ error: 'No members data provided' });
        }

        const scheme = await Scheme.findByPk(id);
        if (!scheme) {
            return res.status(404).json({ error: 'Scheme not found' });
        }

        // Resolve import user id (for createdBy FK)
        const importUserId = req.user?.id || 1;

        // ── SERVICE AUTO-DETECTION MAP ──
        // Load all active services once, then match each billing category
        // to its specific service by scanning name/category keywords.
        const allActiveServices = await Service.findAll({ where: { isActive: true } });

        const matchService = (...keywords) => {
            const kw = keywords.map(k => k.toLowerCase());
            return allActiveServices.find(s => {
                const name = (s.serviceName || '').toLowerCase();
                const cat = (s.category || '').toLowerCase();
                return kw.some(k => name.includes(k) || cat.includes(k));
            }) || null;
        };

        const serviceMap = {
            consultation: matchService('consult', 'opd', 'outpatient'),
            nursing: matchService('nurs', 'nursing'),
            dental: matchService('dental'),
            lodging: matchService('lodg', 'accommodat', 'bed', 'ward'),
            surgicals: matchService('surg', 'theatre', 'theater', 'operat'),
            drRound: matchService('doctor', 'dr round', 'round', 'physician'),
            food: matchService('food', 'diet', 'meal'),
            physio: matchService('physio'),
            pharmacy: matchService('pharm', 'drug', 'medicine', 'dispensary'),
            sundries: matchService('sundry', 'sundries', 'misc', 'dressing'),
            antenatal: matchService('antenatal', 'maternal', 'ante natal', 'postnatal'),
        };

        // Fallback: if a category has no matched service, use any active OPD service
        const fallbackService = matchService('opd', 'outpatient', 'general') || allActiveServices[0] || null;

        let addedCount = 0;
        let updatedCount = 0;
        let failedCount = 0;
        const errors = [];

        // Get initial count for generating new Patient IDs
        // Note: This is approximate in a high-concurrency environment, but sufficient for this use case
        let currentPatientCount = await Patient.count();

        for (const member of members) {
            const t = await sequelize.transaction(); // Start individual transaction
            try {
                // SINOZAM Excel Compatibility: Map column aliases
                // NAME -> firstName, lastName
                let firstName = member.firstName;
                let lastName = member.lastName;
                if (member.NAME && (!firstName || !lastName)) {
                    const parts = member.NAME.trim().split(/\s+/);
                    firstName = parts[0];
                    lastName = parts.slice(1).join(' ') || 'N/A';
                }

                // MAN NO -> policyNumber
                const policyNumber = member.policyNumber || member['MAN NO'] || member.manNumber;

                // Validate required fields
                if (!firstName || !lastName || !policyNumber) {
                    throw new Error(`Missing required fields (Name or Policy Number). Got: ${firstName} ${lastName}, Policy: ${policyNumber}`);
                }

                // Detailed Balance Aliases
                const nursingCare = parseFloat(member.nursingCare || member.NURSING || 0);
                const laboratory = parseFloat(member.laboratory || member.LABORAT || 0);
                const radiology = parseFloat(member.radiology || member.RADIOLO || 0);
                const dental = parseFloat(member.dental || member.DENTAL || 0);
                const lodging = parseFloat(member.lodging || member.LODGING || 0);
                const surgicals = parseFloat(member.surgicals || member.SURGICA || 0);
                const drRound = parseFloat(member.drRound || member['DR ROUN'] || 0);
                const food = parseFloat(member.food || member.FOOD || 0);
                const physio = parseFloat(member.physio || member.PHYSIO || 0);
                const pharmacy = parseFloat(member.pharmacy || member.DRUGS || 0);
                const sundries = parseFloat(member.sundries || member.SUNDARI || 0);
                const antenatal = parseFloat(member.antenatal || member.ANTENET || 0);
                const consultation = parseFloat(member.consultation || member.CONSULT || 0);

                // Calculate total balance for this patient row
                const rowBalance = nursingCare + laboratory + radiology + dental + lodging +
                    surgicals + drRound + food + physio + pharmacy +
                    sundries + antenatal + consultation;

                // Check if patient exists (by Policy Number + Scheme)
                let patient = await Patient.findOne({
                    where: {
                        policyNumber: policyNumber,
                        schemeId: id
                    },
                    transaction: t
                });

                if (!patient && member.nrc) {
                    patient = await Patient.findOne({ where: { nrc: member.nrc }, transaction: t });
                }

                let paymentMethod = 'scheme';
                if (scheme.schemeType === 'corporate') {
                    paymentMethod = 'corporate';
                }

                const patientData = {
                    firstName,
                    lastName,
                    dateOfBirth: member.dateOfBirth || new Date('1990-01-01'),
                    gender: member.gender ? member.gender.toLowerCase() : 'other',
                    policyNumber: policyNumber,
                    schemeId: id,
                    paymentMethod,
                    memberRank: member.rank || 'principal',
                    memberSuffix: member.suffix || 1,
                    phone: member.phone,
                    email: member.email,
                    nrc: member.nrc,
                    address: member.address,
                    memberStatus: 'active',
                    serviceId: req.body.serviceId || null,
                    // Detailed Balances
                    nursingCare,
                    laboratory,
                    radiology,
                    dental,
                    lodging,
                    surgicals,
                    drRound,
                    food,
                    physio,
                    pharmacy,
                    sundries,
                    antenatal,
                    consultation,
                    balance: rowBalance
                };

                let savedPatient;
                const isNew = !patient;

                if (patient) {
                    await patient.update(patientData, { transaction: t });
                    savedPatient = patient;
                    updatedCount++;
                } else {
                    currentPatientCount++;
                    const patientNumber = `P${String(currentPatientCount).padStart(6, '0')}`;
                    savedPatient = await Patient.create({
                        ...patientData,
                        patientNumber
                    }, { transaction: t });
                    addedCount++;
                }

                // ── AUTO-CREATE DEPARTMENT BILLING RECORDS ──
                // Use findOrCreate so re-imports update rather than duplicate
                // Bill number format: IM-{5chrScheme}-{5chrPolicy}-{3chrSuffix} = max 17 chars (fits VARCHAR 20)
                const billDate = new Date().toISOString().slice(0, 10);
                const schemeTag = scheme.schemeCode.replace(/\s/g, '').slice(0, 5).toUpperCase();
                const policyTag = String(policyNumber).replace(/\s/g, '').slice(0, 5).toUpperCase();
                const billBase = `IM-${schemeTag}-${policyTag}`; // e.g. IM-MAD01-C1115 (14 chars)


                // 1. Lab Bill
                if (laboratory > 0) {
                    const labBillNum = `${billBase}-LAB`;
                    const [labBill] = await LabBill.findOrCreate({
                        where: { billNumber: labBillNum },
                        defaults: {
                            billNumber: labBillNum,
                            patientId: savedPatient.id,
                            testName: 'Scheme Import — Laboratory',
                            testCode: 'IMP-LAB',
                            amount: laboratory,
                            netAmount: laboratory,
                            billDate,
                            status: 'completed',
                            paymentStatus: 'claimed',
                            createdBy: importUserId
                        },
                        transaction: t
                    });
                    if (!isNew) {
                        await labBill.update({ amount: laboratory, netAmount: laboratory, patientId: savedPatient.id }, { transaction: t });
                    }
                }

                // 2. Radiology Bill
                if (radiology > 0) {
                    const radBillNum = `${billBase}-RAD`;
                    const [radBill] = await RadiologyBill.findOrCreate({
                        where: { billNumber: radBillNum },
                        defaults: {
                            billNumber: radBillNum,
                            patientId: savedPatient.id,
                            scanType: 'Scheme Import — Radiology',
                            scanCode: 'IMP-RAD',
                            amount: radiology,
                            netAmount: radiology,
                            billDate,
                            status: 'completed',
                            paymentStatus: 'claimed',
                            createdBy: importUserId
                        },
                        transaction: t
                    });
                    if (!isNew) {
                        await radBill.update({ amount: radiology, netAmount: radiology, patientId: savedPatient.id }, { transaction: t });
                    }
                }

                // 3. Per-Service OPD Bills — auto-detect each category's matching service
                // Each non-zero billing category becomes its own OPDBill linked to the
                // specific service, enabling real per-service tracking in corporate statements.
                const opdCategories = [
                    { key: 'consultation', amount: consultation, suffix: 'CNS', label: 'Consultation' },
                    { key: 'nursing', amount: nursingCare, suffix: 'NRS', label: 'Nursing Care' },
                    { key: 'dental', amount: dental, suffix: 'DEN', label: 'Dental' },
                    { key: 'lodging', amount: lodging, suffix: 'LDG', label: 'Lodging/Ward' },
                    { key: 'surgicals', amount: surgicals, suffix: 'SRG', label: 'Surgicals/Theatre' },
                    { key: 'drRound', amount: drRound, suffix: 'DRR', label: "Doctor's Round" },
                    { key: 'food', amount: food, suffix: 'FOD', label: 'Food/Diet' },
                    { key: 'physio', amount: physio, suffix: 'PHY', label: 'Physiotherapy' },
                    { key: 'pharmacy', amount: pharmacy, suffix: 'PHM', label: 'Pharmacy' },
                    { key: 'sundries', amount: sundries, suffix: 'SDR', label: 'Sundries/Dressing' },
                    { key: 'antenatal', amount: antenatal, suffix: 'ANT', label: 'Antenatal Care' },
                ];


                for (const cat of opdCategories) {
                    if (cat.amount <= 0) continue;
                    const svc = serviceMap[cat.key] || fallbackService;
                    if (!svc) continue; // Skip if no service at all in the system

                    const catBillNum = `${billBase}-${cat.suffix}`;
                    const [catBill] = await OPDBill.findOrCreate({
                        where: { billNumber: catBillNum },
                        defaults: {
                            billNumber: catBillNum,
                            patientId: savedPatient.id,
                            serviceId: svc.id,
                            quantity: 1,
                            unitPrice: cat.amount,
                            totalAmount: cat.amount,
                            netAmount: cat.amount,
                            billDate,
                            status: 'pending',
                            paymentStatus: 'claimed',
                            paymentMethod: 'credit',
                            notes: `Scheme import — ${cat.label} for ${firstName} ${lastName} (${policyNumber})`,
                            createdBy: importUserId
                        },
                        transaction: t
                    });
                    if (!isNew) {
                        await catBill.update({
                            unitPrice: cat.amount, totalAmount: cat.amount,
                            netAmount: cat.amount, patientId: savedPatient.id,
                            serviceId: svc.id
                        }, { transaction: t });
                    }
                }


                await t.commit();

            } catch (err) {
                if (t) await t.rollback();
                console.error(`Failed to import member row:`, err);
                failedCount++;
                const msg = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
                errors.push(`Error for ${member.NAME || member.firstName || 'Unknown'}: ${msg}`);
            }
        }

        // POST-IMPORT: Recalculate Scheme Outstanding Balance
        try {
            const allPatients = await Patient.findAll({ where: { schemeId: id } });
            const totalOutstanding = allPatients.reduce((sum, p) => sum + parseFloat(p.balance || 0), 0);
            await scheme.update({ outstandingBalance: totalOutstanding });
            console.log(`Updated Scheme ${id} outstandingBalance to ${totalOutstanding}`);
        } catch (schemeErr) {
            console.error('Failed to update scheme outstanding balance:', schemeErr);
        }

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
        console.error('Import members fatal error:', error);
        res.status(500).json({ error: 'Failed to initiate import process' });
    }
};

// Toggle member status
const updateMemberStatus = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { status } = req.body; // 'active' or 'suspended'

        if (!['active', 'suspended', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }

        const patient = await Patient.findByPk(patientId);
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

module.exports = {
    getAllCorporateAccounts,
    createCorporateAccount,
    getAllSchemes,
    createScheme,
    updateScheme,
    getSchemeById,
    getSchemeStatement,
    getSchemeMembers,
    getFamilyLedger,
    generateMonthlyInvoice,
    getSchemeInvoice,
    getSchemeInvoices,
    importSchemeMembers,
    getAllServices,
    updateMemberStatus
};
