const { Visit, Patient, Scheme, Vitals, PatientMovement, Department, Admission, Bed, Ward, User, OPDBill, Service, sequelize } = require('../models');
const { Op } = require('sequelize');

// Create a new outpatient visit
const createVisit = async (req, res) => {
    try {
        const {
            patientId,
            visitType,
            schemeId,
            departmentId,
            assignedDepartment,
            priority,
            reasonForVisit,
            notes,
            admissionDate,
            initialVitals
        } = req.body;

        // All patients default to Triage since registration is free
        let initialQueueStatus = 'pending_triage';

        // Generate visit number
        const count = await Visit.count();
        const visitNumber = `VIS${String(count + 1).padStart(6, '0')}`;

        const visit = await Visit.create({
            visitNumber,
            patientId,
            visitType,
            schemeId,
            departmentId,
            assignedDepartment,
            priority,
            reasonForVisit,
            notes,
            admissionDate: admissionDate || new Date(),
            status: 'active',
            queueStatus: initialQueueStatus,
            admittedById: req.user.id
        });

        // If initial vitals provided, create them
        if (initialVitals) {
            await Vitals.create({
                ...initialVitals,
                visitId: visit.id,
                patientId,
                recordedBy: req.user.id
            });
        }

        // Create initial movement
        let deptName = assignedDepartment || 'Unknown Department';
        if (departmentId) {
            const dept = await Department.findByPk(departmentId);
            if (dept) deptName = dept.departmentName;
        }

        await PatientMovement.create({
            patientId,
            fromDepartment: 'Admission',
            toDepartment: deptName,
            notes: 'Initial Triage/Consultation',
            movementDate: new Date(),
            admittedBy: req.user.id
        });

        const fullVisit = await Visit.findByPk(visit.id, {
            include: [
                { model: Patient, as: 'patient' },
                { model: Department, as: 'department' }
            ]
        });

        res.status(201).json(fullVisit);
    } catch (error) {
        console.error('Create visit error:', error);
        res.status(500).json({ error: 'Failed to create visit' });
    }
};

// Get all active visits
const getAllVisits = async (req, res) => {
    try {
        const { status, queueStatus, departmentId, search, visitType } = req.query;
        const where = {};
        if (status) where.status = status;
        if (queueStatus) where.queueStatus = queueStatus;
        if (departmentId) where.departmentId = departmentId;
        if (visitType) where.visitType = visitType;

        const patientInclude = { model: Patient, as: 'patient' };
        if (search) {
            patientInclude.where = {
                [Op.or]: [
                    { firstName: { [Op.iLike]: `%${search}%` } },
                    { lastName: { [Op.iLike]: `%${search}%` } },
                    { patientNumber: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const { count, rows: visits } = await Visit.findAndCountAll({
            where,
            include: [
                patientInclude,
                { model: Scheme, as: 'scheme' },
                { model: Department, as: 'department' }
            ],
            order: [['updatedAt', 'DESC']]
        });

        res.json({ visits, total: count });
    } catch (error) {
        console.error('Get visits error:', error);
        res.status(500).json({ error: 'Failed to get visits' });
    }
};

// Get single visit details
const getVisit = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id, {
            include: [
                { model: Patient, as: 'patient' },
                { model: Department, as: 'department' },
                { model: Vitals, as: 'vitals' }
            ]
        });

        if (!visit) {
            return res.status(404).json({ error: 'Visit not found' });
        }

        // Fetch admissions for this patient alongside the visit if needed
        // but not linked directly to the visit to prevent crash
        const admissions = await Admission.findAll({
            where: { patientId: visit.patientId },
            include: [{ model: Bed, as: 'bed', include: [{ model: Ward, as: 'ward' }] }],
            order: [['admissionDate', 'DESC']]
        });

        const visitData = visit.toJSON();
        visitData.admissions = admissions; // manually attach

        res.json(visitData);
    } catch (error) {
        console.error('Get visit error:', error);
        res.status(500).json({ error: 'Failed to get visit' });
    }
};

// Update visit info or transfer department
const updateVisit = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id);
        if (!visit) return res.status(404).json({ error: 'Visit not found' });

        const { departmentId, queueStatus, priority, status } = req.body;

        const oldDept = visit.departmentId;

        if (departmentId && departmentId !== oldDept) {
            // Log movement
            let fromDeptName = 'Unknown';
            let toDeptName = 'Unknown';

            if (oldDept) {
                const oldD = await Department.findByPk(oldDept);
                if (oldD) fromDeptName = oldD.departmentName;
            }
            if (departmentId) {
                const newD = await Department.findByPk(departmentId);
                if (newD) toDeptName = newD.departmentName;
            }

            await PatientMovement.create({
                patientId: visit.patientId,
                fromDepartment: fromDeptName,
                toDepartment: toDeptName,
                notes: 'Department Transfer',
                movementDate: new Date(),
                admittedBy: req.user.id
            });
            visit.departmentId = departmentId;
        }

        if (queueStatus) visit.queueStatus = queueStatus;
        if (priority) visit.priority = priority;
        if (status) visit.status = status;

        await visit.save();

        res.json(visit);
    } catch (error) {
        console.error('Update visit error:', error);
        res.status(500).json({ error: 'Failed to update visit' });
    }
};

// Discharge/Close visit
const dischargeVisit = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id);
        if (!visit) return res.status(404).json({ error: 'Visit not found' });

        visit.status = 'closed';
        visit.dischargeDate = new Date();
        await visit.save();

        res.json({ message: 'Visit closed successfully' });
    } catch (error) {
        console.error('Discharge visit error:', error);
        res.status(500).json({ error: 'Failed to close visit' });
    }
};

// Record patient movements
const getVisitMovements = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id);
        if (!visit) return res.status(404).json({ error: 'Visit not found' });

        const endBound = visit.dischargeDate || new Date();

        const movements = await PatientMovement.findAll({
            where: {
                patientId: visit.patientId,
                movementDate: {
                    [Op.gte]: visit.admissionDate,
                    [Op.lte]: endBound
                }
            },
            include: [
                { model: User, as: 'admitter', attributes: ['firstName', 'lastName'] }
            ],
            order: [['movementDate', 'DESC']]
        });
        res.json(movements);
    } catch (error) {
        console.error('Get movements error:', error);
        res.status(500).json({ error: 'Failed to get movements' });
    }
};

// Quick status update for dashboards
const updateQueueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { queueStatus } = req.body;

        const visit = await Visit.findByPk(id);
        if (!visit) return res.status(404).json({ error: 'Visit not found' });

        visit.queueStatus = queueStatus;
        await visit.save();

        res.json(visit);
    } catch (error) {
        console.error('Update queue status error:', error);
        res.status(500).json({ error: 'Failed to update queue status' });
    }
};

// ── Consultation Quick-Send  (Records → Cashier → Doctor) ─────────────────────
// Called when a receptionist / nurse clicks "Send to Doctor" on the Patient Profile.
// Creates the visit + auto-generates a consultation bill.
//   - Cash patients  → queueStatus = 'pending_cashier'  (wait for cashier to process)
//   - Prepaid/scheme → queueStatus = 'waiting_doctor'   (fee auto-deducted, skip cashier)
const createConsultationVisit = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { patientId, departmentId, assignedDepartment, reasonForVisit, serviceId } = req.body;

        if (!patientId) {
            await t.rollback();
            return res.status(400).json({ error: 'patientId is required' });
        }

        const patient = await Patient.findByPk(patientId, { transaction: t });
        if (!patient) {
            await t.rollback();
            return res.status(404).json({ error: 'Patient not found' });
        }

        const prepayMethods = ['private prepaid', 'private_prepaid', 'corporate', 'scheme', 'staff'];
        const isPrepaid = prepayMethods.includes(patient.paymentMethod);

        // Determine initial queue status
        const initialQueueStatus = isPrepaid ? 'waiting_doctor' : 'pending_cashier';

        // Generate visit number
        const count = await Visit.count({ transaction: t });
        const visitNumber = `VIS${String(count + 1).padStart(6, '0')}`;

        const visit = await Visit.create({
            visitNumber,
            patientId,
            visitType: 'opd',
            departmentId: departmentId || null,
            assignedDepartment: assignedDepartment || 'OPD',
            reasonForVisit: reasonForVisit || 'Consultation',
            admissionDate: new Date(),
            status: 'active',
                queueStatus: 'pending_triage',
                admittedById: req.user.id
            }, { transaction: t });
    
            // Patient movement log
            await PatientMovement.create({
                patientId,
                fromDepartment: 'Reception',
                toDepartment: 'Triage / Vitals',
                notes: 'Free Registration - Sent to Triage',
                movementDate: new Date(),
                admittedBy: req.user.id
            }, { transaction: t });
    
            await t.commit();
    
            const fullVisit = await Visit.findByPk(visit.id, {
                include: [
                    { model: Patient, as: 'patient' },
                    { model: Department, as: 'department' }
                ]
            });
    
            res.status(201).json({
                visit: fullVisit,
                queueStatus: 'pending_triage',
                message: 'Patient registered successfully and sent to Triage.'
            });
    } catch (error) {
        await t.rollback();
        console.error('Create consultation visit error:', error);
        res.status(500).json({ error: 'Failed to create consultation visit', detail: error.message });
    }
};

module.exports = {
    createVisit,
    createConsultationVisit,
    getAllVisits,
    getVisit,
    updateVisit,
    dischargeVisit,
    getVisitMovements,
    updateQueueStatus
};
