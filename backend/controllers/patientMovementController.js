const { PatientMovement, Patient, User } = require('../models');

// Get movement history for a patient
const getPatientMovements = async (req, res) => {
    try {
        const { patientId } = req.params;
        const movements = await PatientMovement.findAll({
            where: { patientId },
            include: [
                { model: User, as: 'admitter', attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [['movementDate', 'DESC']]
        });
        res.json(movements);
    } catch (error) {
        console.error('Error fetching movements:', error);
        res.status(500).json({ error: 'Failed to fetch patient movements' });
    }
};

// Log a new movement
const createMovement = async (req, res) => {
    try {
        const { patientId, fromDepartment, toDepartment, notes, movementDate } = req.body;
        const admittedBy = req.user?.id;

        const movement = await PatientMovement.create({
            patientId,
            fromDepartment,
            toDepartment,
            notes,
            movementDate: movementDate || new Date(),
            admittedBy
        });

        // Update patient's current ward/department if applicable
        // await Patient.update({ ward: toDepartment }, { where: { id: patientId } });

        res.status(201).json(movement);
    } catch (error) {
        console.error('Error creating movement:', error);
        res.status(500).json({ error: 'Failed to log patient movement' });
    }
};

module.exports = {
    getPatientMovements,
    createMovement
};
