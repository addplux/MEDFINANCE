const { OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill, Payment, Patient, Service, User, sequelize } = require('../models');

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

        const tier = patient.paymentMethod; // e.g., 'cash', 'nhima', 'corporate', 'scheme', 'staff'

        if (tier === 'cash' && service.cashPrice > 0) unitPrice = parseFloat(service.cashPrice);
        else if (tier === 'nhima' && service.nhimaPrice > 0) unitPrice = parseFloat(service.nhimaPrice);
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

        // Sum all bills (simplified - in production, might want a centralized Transaction table)
        const opdTotal = await OPDBill.sum('netAmount', { where: { patientId: id } }) || 0;
        const ipdTotal = await IPDBill.sum('totalAmount', { where: { patientId: id } }) || 0;
        const pharmacyTotal = await PharmacyBill.sum('totalAmount', { where: { patientId: id } }) || 0;
        const labTotal = await LabBill.sum('totalAmount', { where: { patientId: id } }) || 0;
        const radiologyTotal = await RadiologyBill.sum('totalAmount', { where: { patientId: id } }) || 0;

        const totalBilled = parseFloat(opdTotal) + parseFloat(ipdTotal) + parseFloat(pharmacyTotal) + parseFloat(labTotal) + parseFloat(radiologyTotal);

        // Sum all payments
        const totalPaid = await Payment.sum('amount', { where: { patientId: id } }) || 0;

        const balance = totalBilled - parseFloat(totalPaid);

        res.json({
            patientId: id,
            totalBilled: totalBilled.toFixed(2),
            totalPaid: parseFloat(totalPaid).toFixed(2),
            balance: balance.toFixed(2)
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

module.exports = {
    getAllOPDBills,
    getOPDBill,
    createOPDBill,
    updateOPDBill,
    deleteOPDBill,
    getPatientBalance,
    getPatientStatement
};
