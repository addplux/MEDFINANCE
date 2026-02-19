const { sequelize, Patient, OPDBill, PharmacyBill, LabBill, RadiologyBill, Payment } = require('../models');

/**
 * Recalculates and updates the balance for a specific patient.
 * Balance = Total Billed Amount (Net) - Total Payments
 * @param {number} patientId - The ID of the patient to update
 * @param {object} transaction - Optional sequelize transaction
 * @returns {Promise<number>} The new balance
 */
const updatePatientBalance = async (patientId, transaction = null) => {
    try {
        if (!patientId) throw new Error('Patient ID is required for balance update');

        // Calculate Total Bills
        // We need to sum up all bill types. This logic replicates `getFamilyLedger` aggregation but for a single patient.

        const billTypes = [OPDBill, PharmacyBill, LabBill, RadiologyBill];
        let totalBilled = 0;

        for (const Model of billTypes) {
            const sum = await Model.sum('netAmount', {
                where: { patientId }, // Ensure models have patientId column (standardize if needed)
                transaction
            });
            totalBilled += (sum || 0);
        }

        // Handle Maternity, Theatre, Specialist if they exist and follow same pattern
        // Assuming core bills cover most for now. Add others as needed.

        // Calculate Total Payments
        const totalPaid = await Payment.sum('amount', {
            where: { patientId },
            transaction
        });

        const newBalance = totalBilled - (totalPaid || 0);

        // Update Patient Record
        await Patient.update(
            { balance: newBalance },
            {
                where: { id: patientId },
                transaction
            }
        );

        return newBalance;

    } catch (error) {
        console.error(`Failed to update balance for patient ${patientId}:`, error);
        throw error; // Propagate error so controller knows
    }
};

module.exports = { updatePatientBalance };
