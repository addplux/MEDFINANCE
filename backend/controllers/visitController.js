const { Op } = require('sequelize');
const { Visit, Patient, Scheme, Department, User, PatientMovement, OPDBill, PharmacyBill, LabBill, RadiologyBill, TheatreBill, MaternityBill, SpecialistClinicBill } = require('../models');

// ── Helpers ─────────────────────────────────────────────────────────────────

const generateVisitNumber = async () => {
    const today = new Date();
    const datePart = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('');

    // Count visits created today to build a sequence
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const count = await Visit.count({ where: { createdAt: { [Op.gte]: startOfDay } } });
    const seq = String(count + 1).padStart(4, '0');
    return `VIS-${datePart}-${seq}`;
};

// ── Controllers ──────────────────────────────────────────────────────────────

// POST /visits
const createVisit = async (req, res) => {
    try {
        const {
            patientId, visitType, schemeId, departmentId,
            assignedDepartment, notes, admissionDate
        } = req.body;

        if (!patientId) return res.status(400).json({ error: 'Patient is required' });
        if (!visitType) return res.status(400).json({ error: 'Visit type is required' });

        const patient = await Patient.findByPk(patientId);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const visitNumber = await generateVisitNumber();

        const visit = await Visit.create({
            visitNumber,
            visitType,
            patientId,
            schemeId: schemeId || null,
            departmentId: departmentId || null,
            assignedDepartment: assignedDepartment || null,
            notes: notes || null,
            admittedById: req.user?.id || null,
            admissionDate: admissionDate || new Date(),
            status: 'active'
        });

        // Log initial patient movement to department
        if (assignedDepartment || departmentId) {
            await PatientMovement.create({
                patientId,
                fromDepartment: null,
                toDepartment: assignedDepartment || 'Assigned Department',
                notes: `Visit ${visitNumber} started (${visitType.toUpperCase()})`,
                admittedBy: req.user?.id || null
            });
        }

        const fullVisit = await Visit.findByPk(visit.id, {
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'patientNumber', 'firstName', 'lastName', 'phone', 'paymentMethod'] },
                { model: User, as: 'admitter', attributes: ['id', 'firstName', 'lastName'] },
                { model: Scheme, as: 'scheme', attributes: ['id', 'name'] },
                { model: Department, as: 'department', attributes: ['id', 'name'] }
            ]
        });

        res.status(201).json(fullVisit);
    } catch (error) {
        console.error('Error creating visit:', error);
        res.status(500).json({ error: 'Failed to create visit', details: error.message });
    }
};

// GET /visits
const getAllVisits = async (req, res) => {
    try {
        const {
            search = '', visitType, status, page = 1, limit = 50
        } = req.query;

        const where = {};
        if (visitType) where.visitType = visitType;
        if (status) where.status = status;

        const patientWhere = {};
        if (search) {
            patientWhere[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { patientNumber: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Visit.findAndCountAll({
            where,
            include: [
                {
                    model: Patient, as: 'patient',
                    attributes: ['id', 'patientNumber', 'firstName', 'lastName', 'phone', 'paymentMethod'],
                    where: Object.keys(patientWhere).length ? patientWhere : undefined,
                    required: Object.keys(patientWhere).length > 0
                },
                { model: User, as: 'admitter', attributes: ['id', 'firstName', 'lastName'] },
                { model: Scheme, as: 'scheme', attributes: ['id', 'name'] },
                { model: Department, as: 'department', attributes: ['id', 'name'] }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        // Enhance visits with daily check-in counts and billing summary
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));

        const enhancedVisits = await Promise.all(rows.map(async (v) => {
            const plainVisit = v.get({ plain: true });

            // Daily Check-in Count
            const dayCount = await Visit.count({
                where: {
                    patientId: plainVisit.patientId,
                    createdAt: { [Op.gte]: startOfDay }
                }
            });
            plainVisit.dailyCheckInCount = dayCount;

            // Simple Billing Aggregation for the day (Scan all bill types)
            // Note: In a production app, we'd want a more efficient way to query these
            const billModels = [OPDBill, PharmacyBill, LabBill, RadiologyBill, TheatreBill, MaternityBill, SpecialistClinicBill];
            let totalBilledToday = 0;
            let pendingBills = 0;

            for (const Model of billModels) {
                const bills = await Model.findAll({
                    where: {
                        patientId: plainVisit.patientId,
                        createdAt: { [Op.gte]: startOfDay }
                    }
                });
                bills.forEach(b => {
                    const amount = parseFloat(b.netAmount || b.amount || b.totalAmount || 0);
                    totalBilledToday += amount;
                    if (b.paymentStatus === 'unpaid' || b.status === 'pending') {
                        pendingBills++;
                    }
                });
            }

            plainVisit.billingSummary = {
                totalAmount: totalBilledToday,
                pendingCount: pendingBills,
                status: pendingBills > 0 ? 'pending' : (totalBilledToday > 0 ? 'cleared' : 'none')
            };

            return plainVisit;
        }));

        res.json({
            visits: enhancedVisits,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching visits:', error);
        res.status(500).json({ error: 'Failed to fetch visits', details: error.message });
    }
};

// GET /visits/:id
const getVisit = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id, {
            include: [
                {
                    model: Patient, as: 'patient',
                    attributes: ['id', 'patientNumber', 'firstName', 'lastName', 'phone',
                        'gender', 'dateOfBirth', 'nrc', 'paymentMethod',
                        'emergencyContact', 'emergencyPhone', 'nextOfKinRelationship', 'photoUrl']
                },
                { model: User, as: 'admitter', attributes: ['id', 'firstName', 'lastName'] },
                { model: Scheme, as: 'scheme', attributes: ['id', 'name'] },
                { model: Department, as: 'department', attributes: ['id', 'name'] }
            ]
        });

        if (!visit) return res.status(404).json({ error: 'Visit not found' });
        res.json(visit);
    } catch (error) {
        console.error('Error fetching visit:', error);
        res.status(500).json({ error: 'Failed to fetch visit', details: error.message });
    }
};

// PUT /visits/:id
const updateVisit = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id);
        if (!visit) return res.status(404).json({ error: 'Visit not found' });

        const { schemeId, departmentId, assignedDepartment, notes, status } = req.body;
        await visit.update({ schemeId, departmentId, assignedDepartment, notes, status });
        res.json(visit);
    } catch (error) {
        console.error('Error updating visit:', error);
        res.status(500).json({ error: 'Failed to update visit', details: error.message });
    }
};

// POST /visits/:id/discharge
const dischargeVisit = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id);
        if (!visit) return res.status(404).json({ error: 'Visit not found' });
        if (visit.status === 'discharged') return res.status(400).json({ error: 'Visit already discharged' });

        await visit.update({ status: 'discharged', dischargeDate: new Date() });

        // Log movement out
        await PatientMovement.create({
            patientId: visit.patientId,
            fromDepartment: visit.assignedDepartment || 'Ward',
            toDepartment: 'Discharged',
            notes: `Patient discharged from visit ${visit.visitNumber}`,
            admittedBy: req.user?.id || null
        });

        res.json({ message: 'Patient discharged successfully', visit });
    } catch (error) {
        console.error('Error discharging visit:', error);
        res.status(500).json({ error: 'Failed to discharge visit', details: error.message });
    }
};

// GET /visits/:id/movements
const getVisitMovements = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id, { attributes: ['id', 'patientId'] });
        if (!visit) return res.status(404).json({ error: 'Visit not found' });

        const movements = await PatientMovement.findAll({
            where: { patientId: visit.patientId },
            include: [{ model: User, as: 'admitter', attributes: ['id', 'firstName', 'lastName'] }],
            order: [['created_at', 'ASC']]
        });

        res.json(movements);
    } catch (error) {
        console.error('Error fetching movements:', error);
        res.status(500).json({ error: 'Failed to fetch movements', details: error.message });
    }
};

module.exports = {
    createVisit,
    getAllVisits,
    getVisit,
    updateVisit,
    dischargeVisit,
    getVisitMovements
};
