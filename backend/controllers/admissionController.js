const { Admission, Ward, Bed, Patient, Payment, sequelize } = require('../models');

const admissionController = {
    // Admit a new patient
    admitPatient: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const {
                patientId,
                wardId,
                bedId,
                admittingDoctorId,
                depositAmount,
                notes
            } = req.body;

            const admittedById = req.user.id; // From auth middleware

            // 1. Verify bed is available
            const bed = await Bed.findOne({ where: { id: bedId, wardId, status: 'available' }, transaction: t });
            if (!bed) {
                await t.rollback();
                return res.status(400).json({ error: 'Selected bed is not available' });
            }

            // 2. Generate Admission Number (e.g., ADM-YYYYMMDD-XXXX)
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await Admission.count({ transaction: t });
            const admissionNumber = `ADM-${dateStr}-${String(count + 1).padStart(4, '0')}`;

            // 3. Create the Admission
            const admission = await Admission.create({
                admissionNumber,
                patientId,
                wardId,
                bedId,
                admittingDoctorId,
                depositAmount: depositAmount || 0,
                notes,
                status: 'admitted',
                admittedById
            }, { transaction: t });

            // 4. Update Bed Status
            await bed.update({
                status: 'occupied',
                currentAdmissionId: admission.id
            }, { transaction: t });

            // 5. Create Payment for Deposit (if amount > 0)
            if (depositAmount && parseFloat(depositAmount) > 0) {
                // Generate receipt number
                const pCount = await Payment.count({ transaction: t });
                const receiptNumber = `REC-${dateStr}-${String(pCount + 1).padStart(4, '0')}`;

                await Payment.create({
                    receiptNumber,
                    patientId,
                    amount: depositAmount,
                    paymentMethod: 'cash', // Defaulting to cash for deposit, can be expanded later
                    billType: 'ipd',
                    notes: `Admission Deposit for ${admissionNumber}`,
                    receivedBy: admittedById,
                    paymentDate: new Date()
                }, { transaction: t });
            }

            await t.commit();
            res.status(201).json(admission);
        } catch (error) {
            await t.rollback();
            console.error('Error admitting patient:', error);
            res.status(500).json({ error: 'Failed to admit patient' });
        }
    },

    // Get all active admissions
    getActiveAdmissions: async (req, res) => {
        try {
            const admissions = await Admission.findAll({
                where: { status: 'admitted' },
                include: [
                    { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] },
                    { model: Ward, as: 'ward', attributes: ['id', 'name'] },
                    { model: Bed, as: 'bed', attributes: ['id', 'bedNumber'] }
                ],
                order: [['admissionDate', 'DESC']]
            });
            res.json(admissions);
        } catch (error) {
            console.error('Error fetching admissions:', error);
            res.status(500).json({ error: 'Failed to fetch active admissions' });
        }
    }
};

module.exports = admissionController;
