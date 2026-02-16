const { LabTest, LabRequest, LabResult, Patient, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

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

        // Generate Request Number
        const count = await LabRequest.count({ transaction: t });
        const requestNumber = `LAB${String(count + 1).padStart(6, '0')}`;

        const request = await LabRequest.create({
            requestNumber,
            patientId,
            requestedBy: req.user.id,
            priority: priority || 'routine',
            clinicalNotes,
            status: 'requested'
        }, { transaction: t });

        // Create empty results for each test (to be filled later)
        const resultPromises = testIds.map(testId => {
            return LabResult.create({
                labRequestId: request.id,
                testId,
                resultValue: '', // Pending
                isAbnormal: false
            }, { transaction: t });
        });

        await Promise.all(resultPromises);

        await t.commit();
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
                    attributes: ['firstName', 'lastName', 'dateOfBirth', 'gender']
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
const updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await LabRequest.findByPk(req.params.id);

        if (!request) return res.status(404).json({ error: 'Request not found' });

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
