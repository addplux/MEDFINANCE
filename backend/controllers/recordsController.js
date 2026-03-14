const { FileRequest, Patient, User } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalRequests = await FileRequest.count();
        const pendingRequests = await FileRequest.count({ where: { status: 'pending' } });
        const fulfilledToday = await FileRequest.count({
            where: {
                status: 'delivered',
                fulfilledAt: { [Op.gte]: today }
            }
        });
        const totalPatients = await Patient.count();

        res.json({
            totalRequests,
            pendingRequests,
            fulfilledToday,
            totalPatients
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const { status, urgency, search } = req.query;
        const where = {};

        if (status) where.status = status;
        if (urgency) where.urgency = urgency;

        const requests = await FileRequest.findAll({
            where,
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] },
                { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
                { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [['requestedAt', 'DESC']],
            limit: 50
        });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRequest = async (req, res) => {
    try {
        const request = await FileRequest.create({
            ...req.body,
            requestedById: req.user.id,
            requestedAt: new Date()
        });

        const fullRequest = await FileRequest.findByPk(request.id, {
            include: [
                { model: Patient, as: 'patient' },
                { model: User, as: 'requestedBy' }
            ]
        });

        res.status(201).json(fullRequest);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.fulfillRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { location } = req.body;

        const request = await FileRequest.findByPk(id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        await request.update({
            status: 'delivered',
            location,
            fulfilledAt: new Date(),
            assignedToId: req.user.id
        });

        res.json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
