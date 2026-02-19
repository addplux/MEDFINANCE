const { Patient } = require('../models');
const { Op } = require('sequelize');

// Get all patients
const getAllPatients = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (search) {
            where[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { patientNumber: { [Op.iLike]: `%${search}%` } },
                { policyNumber: { [Op.iLike]: `%${search}%` } },
                { nhimaNumber: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Patient.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ error: 'Failed to get patients' });
    }
};

// Get single patient
const getPatient = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error('Get patient error:', error);
        res.status(500).json({ error: 'Failed to get patient' });
    }
};

// Create patient
const createPatient = async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, gender, phone, email, address, nhimaNumber, paymentMethod, costCategory, staffId, serviceId, ward, emergencyContact, emergencyPhone } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !dateOfBirth || !gender) {
            return res.status(400).json({ error: 'First name, last name, date of birth, and gender are required' });
        }

        // Generate patient number
        const patientCount = await Patient.count();
        const patientNumber = `P${String(patientCount + 1).padStart(6, '0')}`;

        const patient = await Patient.create({
            patientNumber,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            phone,
            email,
            address,
            nhimaNumber,
            paymentMethod: paymentMethod || 'cash',
            costCategory: costCategory || 'standard',
            staffId: (paymentMethod === 'staff' && staffId) ? staffId : null,
            serviceId: serviceId || null,
            ward: ward || null,
            emergencyContact,
            emergencyPhone
        });

        res.status(201).json(patient);
    } catch (error) {
        console.error('Create patient error:', error);
        res.status(500).json({
            error: 'Failed to create patient',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Update patient
const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        await patient.update(req.body);
        res.json(patient);
    } catch (error) {
        console.error('Update patient error:', error);
        res.status(500).json({ error: 'Failed to update patient' });
    }
};

// Delete patient
const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        await patient.destroy();
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        console.error('Delete patient error:', error);
        res.status(500).json({ error: 'Failed to delete patient' });
    }
};

module.exports = {
    getAllPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient
};
