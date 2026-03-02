const { LabTest, LabRequest, LabResult, Patient, User, PrepaidPlan, LabBill } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');
const { assertPatientActive } = require('../utils/patientStatusGuard');

// ========== Lab Test Management ==========

// Get all lab tests
const getAllTests = async (req, res) => {
    try {
        const { search, category } = req.query;
        const where = { isActive: true };

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } }
            ];
        }
        if (category) where.category = category;

        const tests = await LabTest.findAll({
            where,
            order: [['category', 'ASC'], ['name', 'ASC']]
        });
        res.json(tests);
    } catch (error) {
        console.error('Get lab tests error:', error);
        res.status(500).json({ error: 'Failed to get lab tests' });
    }
};

// Create lab test
const createTest = async (req, res) => {
    try {
        const test = await LabTest.create(req.body);
        res.status(201).json(test);
    } catch (error) {
        console.error('Create lab test error:', error);
        res.status(500).json({ error: 'Failed to create lab test' });
    }
};

// Update lab test
const updateTest = async (req, res) => {
    try {
        const test = await LabTest.findByPk(req.params.id);
        if (!test) return res.status(404).json({ error: 'Lab test not found' });

        await test.update(req.body);
        res.json(test);
    } catch (error) {
        console.error('Update lab test error:', error);
        res.status(500).json({ error: 'Failed to update lab test' });
    }
};

// ========== Lab Requests (Orders) ==========

// Create Lab Request
const createRequest = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { patientId, testIds, priority, clinicalNotes } = req.body;

        if (!patientId || !testIds || testIds.length === 0) {
            return res.status(400).json({ error: 'Patient and tests are required' });
        }

        // Fetch patient and tests
        const patient = await Patient.findByPk(patientId, { transaction: t });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        // Block lab requests for suspended/closed accounts
        try { assertPatientActive(patient); } catch (e) {
            await t.rollback();
            return res.status(e.statusCode || 403).json({ error: e.message, code: e.code });
        }

        const tests = await LabTest.findAll({ where: { id: testIds }, transaction: t });
        const totalAmount = tests.reduce((sum, test) => sum + parseFloat(test.price || 0), 0);

        // For prepaid patients: check they have enough balance, active plan, and usage within limits
        const isPrepaid = patient.paymentMethod === 'private_prepaid';
        if (isPrepaid) {
            // 1. Check Date Validity
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            if (patient.planStartDate && today < patient.planStartDate) {
                await t.rollback();
                return res.status(400).json({ error: `Membership plan not yet active. Starts on: ${patient.planStartDate}` });
            }
            if (patient.planEndDate && today > patient.planEndDate) {
                await t.rollback();
                return res.status(400).json({ error: `Membership plan has expired on ${patient.planEndDate}. Please renew.` });
            }

            // 2. Check Prepaid Balance
            if (parseFloat(patient.balance) < totalAmount) {
                await t.rollback();
                return res.status(400).json({
                    error: `Insufficient prepaid balance. Available: ZK ${parseFloat(patient.balance).toFixed(2)}, Required: ZK ${totalAmount.toFixed(2)}`
                });
            }

            // 3. Check Overall Coverage Limit
            if (patient.memberPlan) {
                const plan = await PrepaidPlan.findOne({
                    where: {
                        [Sequelize.Op.or]: [
                            { planKey: patient.memberPlan },
                            { name: patient.memberPlan }
                        ]
                    },
                    transaction: t
                });

                if (plan) {
                    const currentSpend = parseFloat(patient.totalPlanSpend || 0);
                    const limit = parseFloat(plan.coverageLimit || 0);
                    if (currentSpend + totalAmount > limit) {
                        await t.rollback();
                        return res.status(400).json({
                            error: `Coverage limit exceeded. Plan Limit: ZK ${limit.toFixed(2)}, Used: ZK ${currentSpend.toFixed(2)}, Requested: ZK ${totalAmount.toFixed(2)}`
                        });
                    }
                }
            }
        }

        // Generate Request Number
        const count = await LabRequest.count({ transaction: t });
        const requestNumber = `LAB${String(count + 1).padStart(6, '0')}`;

        const request = await LabRequest.create({
            requestNumber,
            patientId,
            requestedBy: req.user.id,
            priority: priority || 'routine',
            clinicalNotes,
            status: 'requested',
            totalAmount,
            paymentStatus: 'unpaid'
        }, { transaction: t });

        // Create empty results for each test (to be filled later)
        const resultPromises = testIds.map(testId =>
            LabResult.create({
                labRequestId: request.id,
                testId,
                resultValue: '',
                isAbnormal: false
            }, { transaction: t })
        );
        await Promise.all(resultPromises);

        // Create LabBill records if the patient is on a scheme (corporate, scheme)
        // This allows these bills to be picked up by the receivables invoicing module
        const schemeTypes = ['corporate', 'scheme'];
        if (schemeTypes.includes(patient.paymentMethod)) {
            const billPromises = tests.map(async (test) => {
                const billCount = await LabBill.count({ transaction: t });
                const billNumber = `LB${String(billCount + 1).padStart(6, '0')}-${Math.floor(Math.random() * 1000)}`;

                return LabBill.create({
                    billNumber,
                    patientId,
                    testName: test.name,
                    testCode: test.code,
                    amount: test.price,
                    netAmount: test.price,
                    status: 'pending',
                    paymentStatus: 'unpaid',
                    createdBy: req.user.id
                }, { transaction: t });
            });
            await Promise.all(billPromises);
        }

        await t.commit();

        // Auto-deduct prepaid balance AFTER commit so balanceUpdater sees the new LabBill
        if (isPrepaid && totalAmount > 0) {
            const { updatePatientBalance } = require('../utils/balanceUpdater');
            await updatePatientBalance(patientId);
        }

        res.status(201).json(request);

    } catch (error) {
        await t.rollback();
        console.error('Create lab request error:', error);
        res.status(500).json({ error: 'Failed to create lab request' });
    }
};

// Get Requests (Dashboard)
const getRequests = async (req, res) => {
    try {
        const { status, patientId, date } = req.query;
        const where = {};

        if (status) where.status = status;
        if (patientId) where.patientId = patientId;
        if (date) {
            const startOfDay = new Date(date);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.requestDate = { [Op.between]: [startOfDay, endOfDay] };
        }

        const requests = await LabRequest.findAll({
            where,
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'paymentMethod']
                },
                {
                    model: User,
                    as: 'doctor',
                    attributes: ['firstName', 'lastName']
                },
                {
                    model: LabResult,
                    as: 'results',
                    include: [{ model: LabTest, as: 'test', attributes: ['name', 'category'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(requests);
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ error: 'Failed to get lab requests' });
    }
};

// Update Request Status (e.g., Sample Collected)
// PAYMENT GATE: Only allow processing if payment is confirmed (unpaid cash patients are blocked)
const PAID_STATUSES = ['paid', 'prepaid', 'corporate', 'scheme', 'insurance'];

const updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await LabRequest.findByPk(req.params.id, {
            include: [{ model: Patient, as: 'patient', attributes: ['paymentMethod'] }]
        });

        if (!request) return res.status(404).json({ error: 'Request not found' });

        // Block processing for unpaid cash patients
        if (!PAID_STATUSES.includes(request.paymentStatus)) {
            const cashMethods = ['cash', 'private'];
            const isCash = !request.patient || cashMethods.includes(request.patient.paymentMethod);
            if (isCash) {
                return res.status(403).json({
                    error: 'Payment required before processing.',
                    detail: 'Lab fees for this patient have not been paid. Please confirm payment at the cashier first.'
                });
            }
        }

        await request.update({ status });
        res.json(request);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

// ========== Result Entry ==========

// Enter Results
const enterResults = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { results } = req.body; // Array of { resultId, value, isAbnormal, remarks }

        for (const data of results) {
            const result = await LabResult.findByPk(data.resultId, { transaction: t });
            if (result) {
                await result.update({
                    resultValue: data.value,
                    isAbnormal: data.isAbnormal || false,
                    remarks: data.remarks,
                    technicianId: req.user.id
                }, { transaction: t });
            }
        }

        // Check if all results for this request are entered
        if (results.length > 0) {
            const firstResult = await LabResult.findByPk(results[0].resultId, { transaction: t });
            const requestId = firstResult.labRequestId;

            const pendingResults = await LabResult.count({
                where: {
                    labRequestId: requestId,
                    resultValue: ''
                },
                transaction: t
            });

            if (pendingResults === 0) {
                await LabRequest.update({ status: 'completed' }, { where: { id: requestId }, transaction: t });
            } else {
                await LabRequest.update({ status: 'in_progress' }, { where: { id: requestId }, transaction: t });
            }
        }

        await t.commit();
        res.json({ message: 'Results updated successfully' });

    } catch (error) {
        await t.rollback();
        console.error('Enter results error:', error);
        res.status(500).json({ error: 'Failed to enter results' });
    }
};

module.exports = {
    getAllTests,
    createTest,
    updateTest,
    createRequest,
    getRequests,
    updateRequestStatus,
    enterResults
};
