const { RadiologyBill, Visit, Patient, sequelize } = require('../models');
const { Op } = require('sequelize');
const { postChargeToGL } = require('../utils/glPoster');

// Payment statuses that allow processing without cashier confirmation
const PAID_STATUSES = ['paid', 'prepaid', 'corporate', 'scheme', 'insurance'];
const CASH_METHODS = ['cash', 'private'];

// Generate unique bill number
const generateBillNumber = async () => {
    const prefix = 'RAD';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const lastBill = await RadiologyBill.findOne({
        order: [['createdAt', 'DESC']]
    });

    let sequence = 1;
    if (lastBill && lastBill.billNumber && lastBill.billNumber.startsWith(`${prefix}${year}${month}`)) {
        sequence = parseInt(lastBill.billNumber.slice(-4)) + 1;
    }

    return `${prefix}${year}${month}${sequence.toString().padStart(4, '0')}`;
};

// Generate unique visit number
const generateVisitNumber = async (transaction) => {
    const today = new Date();
    const datePart = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('');

    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const count = await Visit.count({
        where: { createdAt: { [Op.gte]: startOfDay } },
        transaction
    });
    const seq = String(count + 1).padStart(4, '0');
    return `VIS-${datePart}-${seq}`;
};

exports.createRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { patientId, schemeId, priority, clinicalNotes, serviceIds } = req.body;

        // Find Radiology department ID dynamically or fallback to 3
        const radiologyDept = await require('../models').Department.findOne({
            where: { departmentName: 'Radiology' },
            transaction
        });
        const deptId = radiologyDept ? radiologyDept.id : 3;

        // 1. Create a Visit to put patient in the Radiology Queue
        const visitNumber = await generateVisitNumber(transaction);
        const visit = await Visit.create({
            visitNumber,
            patientId,
            visitType: 'opd',
            schemeId,
            departmentId: deptId,
            status: 'active',
            notes: clinicalNotes
        }, { transaction });

        // 2. Create the RadiologyBill
        const billNumber = await generateBillNumber();

        // Fetch service prices to calculate total
        const services = await require('../models').Service.findAll({
            where: { id: serviceIds },
            transaction
        });
        const totalAmount = services.reduce((sum, s) => sum + Number(s.price), 0);

        // Determine payment status based on patient payment method
        const patientRecord = await Patient.findByPk(patientId, { transaction });
        const patientMethod = patientRecord ? patientRecord.paymentMethod : 'cash';
        const initialPaymentStatus = CASH_METHODS.includes(patientMethod) ? 'unpaid' :
            ['corporate'].includes(patientMethod) ? 'corporate' :
            ['scheme', 'insurance'].includes(patientMethod) ? 'scheme' : 'prepaid';

        const bill = await RadiologyBill.create({
            billNumber,
            visitId: visit.id,
            patientId,
            scanType: services.map(s => s.serviceName).join(', '),
            priority: priority || 'routine',
            clinicalNotes,
            amount: totalAmount,
            netAmount: totalAmount,
            createdBy: req.user.id,
            status: 'pending',
            paymentStatus: initialPaymentStatus,
            billDate: new Date()
        }, { transaction });

        // Post to General Ledger as Pending Revenue (using 4000 as placeholder revenue account)
        await postChargeToGL(bill, '4000', transaction);

        await transaction.commit();
        res.status(201).json({ message: 'Radiology request created successfully', visit, bill });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating radiology request:', error);
        res.status(500).json({ error: 'Failed to create radiology request', details: error.message });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const { status, patientId } = req.query;
        const where = {};

        if (status) where.status = status;
        if (patientId) where.patientId = patientId;

        const requests = await RadiologyBill.findAll({
            where,
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'hospitalNumber', 'paymentMethod'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching radiology requests:', error);
        res.status(500).json({ error: 'Failed to fetch radiology requests' });
    }
};

// Update radiology request status — enforces payment gate
exports.updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const bill = await RadiologyBill.findByPk(req.params.id, {
            include: [{ model: Patient, as: 'patient', attributes: ['paymentMethod'] }]
        });

        if (!bill) return res.status(404).json({ error: 'Radiology request not found' });

        // Payment gate: block cash/private patients if bill is unpaid
        if (!PAID_STATUSES.includes(bill.paymentStatus)) {
            const isCash = !bill.patient || CASH_METHODS.includes(bill.patient.paymentMethod);
            if (isCash) {
                return res.status(403).json({
                    error: 'Payment required before processing.',
                    detail: 'Radiology fees for this patient have not been paid. Please confirm payment at the cashier first.'
                });
            }
        }

        await bill.update({ status });
        res.json(bill);
    } catch (error) {
        console.error('Error updating radiology status:', error);
        res.status(500).json({ error: 'Failed to update radiology request status' });
    }
};
