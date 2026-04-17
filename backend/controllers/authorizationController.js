const { Visit, Patient, PatientMovement, User, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/authorization
 * Returns all visits where queueStatus = 'pending_authorization'
 * Used by Medical Officers / Doctors to review referral patients
 */
const getPendingAuthorizations = async (req, res) => {
    try {
        const { search } = req.query;

        const patientInclude = { model: Patient, as: 'patient' };
        if (search) {
            patientInclude.where = {
                [Op.or]: [
                    { firstName: { [Op.iLike]: `%${search}%` } },
                    { lastName: { [Op.iLike]: `%${search}%` } },
                    { nrc: { [Op.iLike]: `%${search}%` } },
                    { manNumber: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const { count, rows: visits } = await Visit.findAndCountAll({
            where: { queueStatus: 'pending_authorization', status: 'active' },
            include: [
                patientInclude,
                { model: User, as: 'admitter', attributes: ['firstName', 'lastName'] }
            ],
            order: [['createdAt', 'ASC']] // FIFO — oldest first
        });

        res.json({ visits, total: count });
    } catch (error) {
        console.error('Get pending authorizations error:', error);
        res.status(500).json({ error: 'Failed to get pending authorizations' });
    }
};

/**
 * PUT /api/authorization/:visitId/approve
 * Approves a referral patient — moves them to pending_cashier queue
 */
const approveAuthorization = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { visitId } = req.params;
        const { notes } = req.body;

        const visit = await Visit.findByPk(visitId, {
            include: [{ model: Patient, as: 'patient' }],
            transaction: t
        });

        if (!visit) {
            await t.rollback();
            return res.status(404).json({ error: 'Visit not found' });
        }

        if (visit.queueStatus !== 'pending_authorization') {
            await t.rollback();
            return res.status(400).json({ error: 'Visit is not pending authorization' });
        }

        visit.queueStatus = 'pending_cashier';
        await visit.save({ transaction: t });

        // Log movement
        await PatientMovement.create({
            patientId: visit.patientId,
            fromDepartment: 'Authorization',
            toDepartment: 'Cashier',
            notes: notes || 'Authorization approved — patient sent to Cashier',
            movementDate: new Date(),
            admittedBy: req.user.id
        }, { transaction: t });

        await t.commit();

        res.json({
            message: 'Authorization approved. Patient sent to Cashier.',
            visit
        });
    } catch (error) {
        await t.rollback();
        console.error('Approve authorization error:', error);
        res.status(500).json({ error: 'Failed to approve authorization' });
    }
};

/**
 * PUT /api/authorization/:visitId/reject
 * Rejects a referral — marks visit cancelled and logs reason
 */
const rejectAuthorization = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { visitId } = req.params;
        const { reason } = req.body;

        const visit = await Visit.findByPk(visitId, {
            include: [{ model: Patient, as: 'patient' }],
            transaction: t
        });

        if (!visit) {
            await t.rollback();
            return res.status(404).json({ error: 'Visit not found' });
        }

        if (visit.queueStatus !== 'pending_authorization') {
            await t.rollback();
            return res.status(400).json({ error: 'Visit is not pending authorization' });
        }

        visit.queueStatus = 'pending_cashier'; // Return to Records/Cashier for review
        visit.notes = reason ? `Authorization rejected: ${reason}` : 'Authorization rejected by medical officer';
        await visit.save({ transaction: t });

        // Log movement
        await PatientMovement.create({
            patientId: visit.patientId,
            fromDepartment: 'Authorization',
            toDepartment: 'Records',
            notes: `Authorization rejected — ${reason || 'No reason provided'}`,
            movementDate: new Date(),
            admittedBy: req.user.id
        }, { transaction: t });

        await t.commit();

        res.json({
            message: 'Authorization rejected. Patient returned to Records.',
            visit
        });
    } catch (error) {
        await t.rollback();
        console.error('Reject authorization error:', error);
        res.status(500).json({ error: 'Failed to reject authorization' });
    }
};

module.exports = {
    getPendingAuthorizations,
    approveAuthorization,
    rejectAuthorization
};
