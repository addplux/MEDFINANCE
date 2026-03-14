const { FileRequest, Patient, User, Visit, PatientMovement } = require('../models');
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

exports.getActivityLog = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 15;

        // 1. Get recent patient registrations
        const registrations = await Patient.findAll({
            limit,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'firstName', 'lastName', 'patientNumber', 'createdAt']
        });

        // 2. Get recent visits
        const visits = await Visit.findAll({
            limit,
            order: [['createdAt', 'DESC']],
            include: [
                { model: Patient, as: 'patient', attributes: ['firstName', 'lastName', 'patientNumber', 'paymentMethod'] },
                { model: User, as: 'admitter', attributes: ['firstName', 'lastName', 'username'] }
            ]
        });

        // 3. Get recent patient movements (queuing events)
        const movements = await PatientMovement.findAll({
            limit,
            order: [['movementDate', 'DESC']],
            include: [
                { model: Patient, as: 'patient', attributes: ['firstName', 'lastName', 'patientNumber'] },
                { model: User, as: 'admitter', attributes: ['firstName', 'lastName', 'username'] }
            ]
        });

        // Combine and format
        const activities = [
            ...registrations.map(r => ({
                id: `reg-${r.id}`,
                type: 'registration',
                category: 'Patient Management',
                title: 'Patient Registered',
                summary: `New patient: ${r.firstName} ${r.lastName}`,
                user: 'System Admin', // Fallback as registration doesn't track user directly in simple Patient model
                timestamp: r.createdAt
            })),
            ...visits.map(v => ({
                id: `vis-${v.id}`,
                type: 'visit',
                category: 'Visit/Encounter',
                title: v.paymentMethod === 'cash' ? 'Visit Created + Consultation Fee Added' : 'Visit Created',
                summary: `Visit ${v.visitNumber} created for ${v.patient?.firstName} ${v.patient?.lastName}${v.patient?.paymentMethod === 'cash' ? ' (Cash). Consultation fee: K150.' : ''}`,
                user: v.admitter ? `${v.admitter.firstName} ${v.admitter.lastName}` : 'Staff',
                timestamp: v.createdAt
            })),
            ...movements.map(m => ({
                id: `mov-${m.id}`,
                type: 'movement',
                category: 'Visit/Encounter',
                title: m.notes || 'Patient Queued for Consultation',
                summary: `${m.patient?.firstName} ${m.patient?.lastName} added to ${m.toDepartment} queue.`,
                user: m.admitter ? `${m.admitter.firstName} ${m.admitter.lastName}` : 'Staff',
                timestamp: m.movementDate
            }))
        ];

        // Sort by timestamp descending
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json(activities.slice(0, limit));
    } catch (error) {
        console.error('Activity log error:', error);
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
