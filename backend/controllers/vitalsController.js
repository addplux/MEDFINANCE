/**
 * Vitals Controller
 * Handles recording and fetching patient triage vitals.
 */
const { Vitals, Visit, Patient, User } = require('../models');

// GET /vitals/visit/:visitId
const getVitals = async (req, res) => {
    try {
        const { visitId } = req.params;
        const vitals = await Vitals.findOne({
            where: { visitId },
            include: [
                { model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'role'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        if (!vitals) return res.status(404).json({ error: 'Vitals not found for this visit' });
        res.json(vitals);
    } catch (error) {
        console.error('Error fetching vitals:', error);
        res.status(500).json({ error: 'Failed to fetch vitals' });
    }
};

// POST /vitals
const createVitals = async (req, res) => {
    try {
        const { visitId, patientId, bloodPressure, temperature, pulse, respiratoryRate, spo2, weight, height, bmi, notes } = req.body;

        if (!visitId || !patientId) return res.status(400).json({ error: 'visitId and patientId are required' });

        // Record the vitals
        const vitals = await Vitals.create({
            visitId,
            patientId,
            bloodPressure,
            temperature,
            pulse,
            respiratoryRate,
            spo2,
            weight,
            height,
            bmi,
            notes,
            recordedById: req.user?.id || null
        });

        // ── Real World OPD Flow ──
        // Once Triage records vitals, the patient moves from `pending_triage` to `waiting_doctor`
        await Visit.update(
            { queueStatus: 'waiting_doctor' },
            { where: { id: visitId, queueStatus: 'pending_triage' } }
        );

        res.status(201).json(vitals);
    } catch (error) {
        console.error('Error recording vitals:', error);
        res.status(500).json({ error: 'Failed to record vitals' });
    }
};

module.exports = {
    getVitals,
    createVitals
};
