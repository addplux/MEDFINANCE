const { OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill, Payment, Patient, Service, User, sequelize, TheatreBill, MaternityBill, SpecialistClinicBill, LabRequest, LabTest, LabResult, Medication } = require('../models');
const { updatePatientBalance } = require('../utils/balanceUpdater');
const { postChargeToGL } = require('../utils/glPoster');

// Get all OPD bills
const getAllOPDBills = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const { count, rows } = await OPDBill.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [
                { association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] },
                { association: 'service', attributes: ['id', 'serviceName', 'serviceCode'] },
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
        console.error('Get OPD bills error:', error);
        res.status(500).json({ error: 'Failed to get OPD bills' });
    }
};

// Get single OPD bill
const getOPDBill = async (req, res) => {
    try {
        const bill = await OPDBill.findByPk(req.params.id, {
            include: [
                { association: 'patient' },
                { association: 'service' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        if (!bill) {
            return res.status(404).json({ error: 'OPD bill not found' });
        }

        res.json(bill);
    } catch (error) {
        console.error('Get OPD bill error:', error);
        res.status(500).json({ error: 'Failed to get OPD bill' });
    }
};

// Create OPD bill
const createOPDBill = async (req, res) => {
    try {
        const { patientId, serviceId, quantity, discount, paymentMethod, notes } = req.body;

        // Validate required fields
        if (!patientId || !serviceId) {
            return res.status(400).json({ error: 'Patient and service are required' });
        }

        // Get service to get price
        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        // Get patient to determine pricing tier
        const patient = await Patient.findByPk(patientId);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Determine unit price based on patient's payment method
        let unitPrice = parseFloat(service.price); // Base fallback

        const tier = patient.paymentMethod; // e.g., 'cash', 'corporate', 'scheme', 'staff'

        if (tier === 'cash' && service.cashPrice > 0) unitPrice = parseFloat(service.cashPrice);
        else if (tier === 'corporate' && service.corporatePrice > 0) unitPrice = parseFloat(service.corporatePrice);
        else if (tier === 'scheme' && service.schemePrice > 0) unitPrice = parseFloat(service.schemePrice);
        else if (tier === 'staff' && service.staffPrice > 0) unitPrice = parseFloat(service.staffPrice);

        // Calculate amounts
        const qty = quantity || 1;
        const totalAmount = unitPrice * qty;
        const discountAmount = parseFloat(discount) || 0;
        const netAmount = totalAmount - discountAmount;

        // Generate bill number
        const billCount = await OPDBill.count();
        const billNumber = `OPD${String(billCount + 1).padStart(6, '0')}`;

        // Check Staff Medical Limits
        if (tier === 'staff') {
            const staffId = patient.staffId; // Use linked staff ID for dependents (or self)

            if (!staffId) {
                return res.status(400).json({ error: 'Staff patient must be linked to a staff member' });
            }

            const staffMember = await User.findByPk(staffId);
            if (!staffMember) {
                return res.status(404).json({ error: 'Linked staff member not found' });
            }

            // Check limits
            const newUsageMonthly = parseFloat(staffMember.medicalUsageMonthly || 0) + totalAmount;
            const newUsageAnnual = parseFloat(staffMember.medicalUsageAnnual || 0) + totalAmount;

            const limitMonthly = parseFloat(staffMember.medicalLimitMonthly || 0);
            const limitAnnual = parseFloat(staffMember.medicalLimitAnnual || 0);

            if (limitMonthly > 0 && newUsageMonthly > limitMonthly) {
                return res.status(400).json({
                    error: `Monthly medical limit exceeded. Available: K${(limitMonthly - parseFloat(staffMember.medicalUsageMonthly)).toFixed(2)}`
                });
            }

            if (limitAnnual > 0 && newUsageAnnual > limitAnnual) {
                return res.status(400).json({
                    error: `Annual medical limit exceeded. Available: K${(limitAnnual - parseFloat(staffMember.medicalUsageAnnual)).toFixed(2)}`
                });
            }

            // Update usage (Optimistic update - in a real app, use transaction)
            await staffMember.update({
                medicalUsageMonthly: newUsageMonthly,
                medicalUsageAnnual: newUsageAnnual
            });
        }

        // Create bill
        const bill = await OPDBill.create({
            billNumber,
            patientId,
            serviceId,
            quantity: qty,
            unitPrice,
            totalAmount,
            discount: discountAmount,
            netAmount,
            paymentMethod,
            notes,
            createdBy: req.user.id
        });

        // Update Patient Balance
        await updatePatientBalance(patientId);

        // Post to GL
        await postChargeToGL(bill, '4000'); // Assuming 4000 is OPD Revenue

        // Fetch with associations
        const createdBill = await OPDBill.findByPk(bill.id, {
            include: [
                { association: 'patient' },
                { association: 'service' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json(createdBill);
    } catch (error) {
        console.error('Create OPD bill error:', error);
        res.status(500).json({ error: 'Failed to create OPD bill' });
    }
};

// Update OPD bill
const updateOPDBill = async (req, res) => {
    try {
        const bill = await OPDBill.findByPk(req.params.id);

        if (!bill) {
            return res.status(404).json({ error: 'OPD bill not found' });
        }

        // Update allowed fields
        const { status, paymentMethod, notes, discount } = req.body;

        if (status) bill.status = status;
        if (paymentMethod) bill.paymentMethod = paymentMethod;
        if (notes !== undefined) bill.notes = notes;
        if (discount !== undefined) {
            bill.discount = parseFloat(discount);
            bill.netAmount = bill.totalAmount - bill.discount;
        }

        await bill.save();

        // Update Patient Balance
        await updatePatientBalance(bill.patientId);

        // Fetch with associations
        const updatedBill = await OPDBill.findByPk(bill.id, {
            include: [
                { association: 'patient' },
                { association: 'service' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json(updatedBill);
    } catch (error) {
        console.error('Update OPD bill error:', error);
        res.status(500).json({ error: 'Failed to update OPD bill' });
    }
};

// Delete OPD bill
const deleteOPDBill = async (req, res) => {
    try {
        const bill = await OPDBill.findByPk(req.params.id);

        if (!bill) {
            return res.status(404).json({ error: 'OPD bill not found' });
        }

        await bill.destroy();

        // Update Patient Balance
        await updatePatientBalance(bill.patientId);

        res.json({ message: 'OPD bill deleted successfully' });
    } catch (error) {
        console.error('Delete OPD bill error:', error);
        res.status(500).json({ error: 'Failed to delete OPD bill' });
    }
};

// Get patient balance
const getPatientBalance = async (req, res) => {
    try {
        const { id } = req.params;

        // Efficiently get balance from Patient model
        const patient = await Patient.findByPk(id, { attributes: ['balance'] });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({
            patientId: id,
            balance: patient.balance,
            // Deprecated breakdowns could be removed or calculated on demand if UI needs them
            // For now, ensuring frontend receives the 'balance' key correctly
        });
    } catch (error) {
        console.error('Get patient balance error:', error);
        res.status(500).json({ error: 'Failed to get patient balance' });
    }
};

// Get patient statement
const getPatientStatement = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch all activities
        const payments = await Payment.findAll({
            where: { patientId: id },
            order: [['paymentDate', 'ASC']]
        });

        const opdBills = await OPDBill.findAll({ where: { patientId: id } });
        const ipdBills = await IPDBill.findAll({ where: { patientId: id } });
        // Add other bill types as needed

        // Combine and sort
        const activities = [];

        payments.forEach(p => {
            activities.push({
                date: p.paymentDate,
                type: 'PAYMENT',
                reference: p.receiptNumber || `PAY-${p.id}`,
                description: `Payment via ${p.paymentMethod}`,
                debit: 0,
                credit: parseFloat(p.amount)
            });
        });

        opdBills.forEach(b => {
            activities.push({
                date: b.createdAt,
                type: 'BILL',
                reference: b.billNumber,
                description: 'OPD Services',
                debit: parseFloat(b.netAmount),
                credit: 0
            });
        });

        ipdBills.forEach(b => {
            activities.push({
                date: b.createdAt,
                type: 'BILL',
                reference: b.billNumber || `IPD-${b.id}`, // Fallback if no bill number
                description: 'Inpatient Services',
                debit: parseFloat(b.totalAmount),
                credit: 0
            });
        });

        // Sort by date
        activities.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate running balance
        let balance = 0;
        const statement = activities.map(item => {
            balance += item.debit - item.credit;
            return {
                ...item,
                balance: balance.toFixed(2)
            };
        });

        res.json({
            patientId: id,
            statement
        });
    } catch (error) {
        console.error('Get patient statement error:', error);
        res.status(500).json({ error: 'Failed to get patient statement' });
    }
};

// Get all unpaid bills for a patient across all departments
const getUnpaidPatientBills = async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = Number(id);
        const unpaidBills = [];

        if (isNaN(patientId)) {
            console.error('[DEBUG] Invalid patientId received:', id);
            return res.json([]);
        }

        console.log(`[DEBUG] getUnpaidPatientBills started for patientId: ${patientId}`);

        // Fetch IPD
        try {
            const ipdBills = await IPDBill.findAll({
                where: { patientId, paymentStatus: 'unpaid' }
            });
            console.log(`[DEBUG] IPD: found ${ipdBills.length}`);
            ipdBills.forEach(b => unpaidBills.push({
                ...b.toJSON(),
                department: 'IPD',
                description: 'Inpatient Care',
                billType: 'IPDBill'
            }));
        } catch (e) {
            console.error('[DEBUG] IPD fetch error:', e.message);
        }

        // Fetch OPD
        try {
            const opdBills = await OPDBill.findAll({
                where: { patientId, paymentStatus: 'unpaid' },
                include: [{ association: 'service' }]
            });
            console.log(`[DEBUG] OPD bills: found ${opdBills.length}`);
            opdBills.forEach(b => unpaidBills.push({
                ...b.toJSON(),
                department: 'OPD',
                description: b.service?.serviceName || b.service?.name || 'OPD Service',
                billType: 'OPDBill'
            }));
        } catch (e) {
            console.error('[DEBUG] OPD fetch error:', e.message);
        }

        // Fetch Pharmacy
        try {
            const pharmacyBills = await PharmacyBill.findAll({
                where: { patientId, paymentStatus: 'unpaid' },
                include: [{ association: 'medicationDetails' }]
            });
            console.log(`[DEBUG] Pharmacy bills: found ${pharmacyBills.length}`);
            pharmacyBills.forEach(b => unpaidBills.push({
                ...b.toJSON(),
                department: 'Pharmacy',
                description: b.medicationDetails?.name || 'Medication',
                billType: 'PharmacyBill'
            }));
        } catch (e) {
            console.error('[DEBUG] Pharmacy fetch error:', e.message);
        }

        // Fetch Lab Requests
        try {
            const labRequests = await LabRequest.findAll({
                where: { patientId, paymentStatus: 'unpaid' },
                include: [
                    {
                        model: LabResult,
                        as: 'results',
                        include: [{ model: LabTest, as: 'test' }]
                    }
                ]
            });
            console.log(`[DEBUG] Lab requests: found ${labRequests.length}`);
            labRequests.forEach(r => {
                const testNames = r.results?.map(res => res.test?.name).filter(Boolean).join(', ') || 'Lab Tests';
                unpaidBills.push({
                    ...r.toJSON(),
                    netAmount: r.totalAmount,
                    department: 'Laboratory',
                    description: testNames,
                    billType: 'LabRequest'
                });
            });
        } catch (e) {
            console.error('[DEBUG] LabRequest fetch error:', e.message);
        }

        // Fetch LabBill
        try {
            const labBills = await LabBill.findAll({
                where: { patientId, paymentStatus: 'unpaid' }
            });
            console.log(`[DEBUG] LabBill: found ${labBills.length}`);
            labBills.forEach(b => unpaidBills.push({
                ...b.toJSON(),
                department: 'Laboratory',
                description: b.testName,
                billType: 'LabBill'
            }));
        } catch (e) {
            console.error('[DEBUG] LabBill fetch error:', e.message);
        }

        // Fetch others with simple mapping
        const otherDepts = [
            { model: RadiologyBill, dept: 'Radiology', type: 'RadiologyBill', descField: 'scanType' },
            { model: TheatreBill, dept: 'Theatre', type: 'TheatreBill', descField: 'procedureType' },
            { model: MaternityBill, dept: 'Maternity', type: 'MaternityBill', desc: (b) => `Maternity (${b.deliveryType || 'Care'})` },
            { model: SpecialistClinicBill, dept: 'Specialist Clinic', type: 'SpecialistClinicBill', desc: (b) => `Consultation (${b.clinicType})` }
        ];

        for (const d of otherDepts) {
            try {
                const bills = await d.model.findAll({ where: { patientId, paymentStatus: 'unpaid' } });
                console.log(`[DEBUG] ${d.dept} bills: found ${bills.length}`);
                bills.forEach(b => unpaidBills.push({
                    ...b.toJSON(),
                    department: d.dept,
                    description: d.desc ? d.desc(b) : b[d.descField],
                    billType: d.type
                }));
            } catch (e) {
                console.error(`[DEBUG] ${d.dept} fetch error:`, e.message);
            }
        }

        console.log(`[DEBUG] Total unpaid bills for P${patientId}: ${unpaidBills.length}`);
        res.json(unpaidBills);
    } catch (error) {
        console.error('[DEBUG] Global fetch error:', error);
        res.status(500).json({ error: 'Failed to get unpaid patient bills' });
    }
};

// Get a consolidated queue of all patients with unpaid bills across all departments
const getPendingQueue = async (req, res) => {
    try {
        // Query all tables for 'unpaid' records

        // Query all tables for 'unpaid' records
        const [opd, pharmacy, lab, radiology, theatre, maternity, specialist] = await Promise.all([
            OPDBill.findAll({ where: { paymentStatus: 'unpaid' }, include: [{ association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] }] }),
            PharmacyBill.findAll({ where: { paymentStatus: 'unpaid' }, include: [{ association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] }] }),
            LabRequest.findAll({ where: { paymentStatus: 'unpaid' }, include: [{ association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] }] }),
            RadiologyBill.findAll({ where: { paymentStatus: 'unpaid' }, include: [{ association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] }] }),
            TheatreBill.findAll({ where: { paymentStatus: 'unpaid' }, include: [{ association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] }] }),
            MaternityBill.findAll({ where: { paymentStatus: 'unpaid' }, include: [{ association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] }] }),
            SpecialistClinicBill.findAll({ where: { paymentStatus: 'unpaid' }, include: [{ association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] }] })
        ]);

        const queueMap = new Map();

        const processRecords = (records, dept) => {
            records.forEach(r => {
                if (!r.patient) return;
                const pid = r.patient.id;
                const amount = parseFloat(r.netAmount || r.totalAmount || 0);

                if (!queueMap.has(pid)) {
                    queueMap.set(pid, {
                        id: pid,
                        patientNumber: r.patient.patientNumber,
                        firstName: r.patient.firstName,
                        lastName: r.patient.lastName,
                        departments: new Set([dept]),
                        totalAmount: amount,
                        itemCount: 1,
                        lastRequest: r.createdAt
                    });
                } else {
                    const existing = queueMap.get(pid);
                    existing.departments.add(dept);
                    existing.totalAmount += amount;
                    existing.itemCount += 1;
                    if (new Date(r.createdAt) > new Date(existing.lastRequest)) {
                        existing.lastRequest = r.createdAt;
                    }
                }
            });
        };

        processRecords(opd, 'OPD');
        processRecords(pharmacy, 'Pharmacy');
        processRecords(lab, 'Laboratory');
        processRecords(radiology, 'Radiology');
        processRecords(theatre, 'Theatre');
        processRecords(maternity, 'Maternity');
        processRecords(specialist, 'Specialist Clinic');

        // Convert Map to sorted array
        const result = Array.from(queueMap.values()).map(p => ({
            ...p,
            departments: Array.from(p.departments).join(', ')
        })).sort((a, b) => new Date(b.lastRequest) - new Date(a.lastRequest));

        res.json(result);
    } catch (error) {
        console.error('Get pending queue error:', error);
        res.status(500).json({ error: 'Failed to get pending cashier queue' });
    }
};

module.exports = {
    getAllOPDBills,
    getOPDBill,
    createOPDBill,
    updateOPDBill,
    deleteOPDBill,
    getPatientBalance,
    getPatientStatement,
    getUnpaidPatientBills,
    getPendingQueue
};
