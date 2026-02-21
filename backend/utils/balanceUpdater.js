const { Patient, OPDBill, PharmacyBill, LabBill, RadiologyBill,
    MaternityBill, TheatreBill, SpecialistClinicBill, Payment } = require('../models');

/**
 * Recalculates and updates the balance for a specific patient.
 *
 * For STANDARD patients (cash, nhima, corporate, etc.):
 *   balance = totalBilled - totalPaid  (outstanding debt)
 *
 * For PRIVATE PREPAID patients:
 *   balance = prepaidCredit - totalBilled  (remaining credit)
 *   prepaidCredit is the cumulative total of all top-ups ever made.
 *
 * @param {number} patientId - The ID of the patient to update
 * @param {object} transaction - Optional sequelize transaction
 * @returns {Promise<number>} The new balance
 */
const updatePatientBalance = async (patientId, transaction = null) => {
    try {
        if (!patientId) throw new Error('Patient ID is required for balance update');

        // Fetch patient to check payment method & current prepaid credit
        const patient = await Patient.findByPk(patientId, { transaction });
        if (!patient) throw new Error(`Patient ${patientId} not found`);

        // Sum all bill types
        const billModels = [OPDBill, PharmacyBill, LabBill, RadiologyBill];
        // Optionally include these if they exist in models
        try { billModels.push(require('../models').MaternityBill); } catch (_) { }
        try { billModels.push(require('../models').TheatreBill); } catch (_) { }
        try { billModels.push(require('../models').SpecialistClinicBill); } catch (_) { }

        let totalBilled = 0;
        for (const Model of billModels) {
            if (!Model || !Model.sum) continue;
            const field = Model.rawAttributes?.netAmount ? 'netAmount' : 'totalAmount';
            const sum = await Model.sum(field, {
                where: { patientId },
                transaction
            });
            totalBilled += (sum || 0);
        }

        let newBalance;

        if (patient.paymentMethod === 'private_prepaid') {
            // For prepaid: remaining = total credits - total billed
            // prepaidCredit is set/incremented separately on registration & top-up.
            const credit = parseFloat(patient.prepaidCredit || 0);
            newBalance = credit - totalBilled;
        } else {
            // For everyone else: balance = outstanding debt
            const totalPaid = await Payment.sum('amount', {
                where: { patientId },
                transaction
            });
            newBalance = totalBilled - (totalPaid || 0);
        }

        await Patient.update(
            { balance: newBalance },
            { where: { id: patientId }, transaction }
        );

        return newBalance;

    } catch (error) {
        console.error(`Failed to update balance for patient ${patientId}:`, error);
        throw error;
    }
};

/**
 * Adds credit to a prepaid patient's prepaidCredit total and
 * recalculates their running balance.
 *
 * @param {number} patientId
 * @param {number} amount - Amount to credit
 * @param {object} transaction - Optional sequelize transaction
 */
const addPrepaidCredit = async (patientId, amount, transaction = null) => {
    const patient = await Patient.findByPk(patientId, { transaction });
    if (!patient) throw new Error(`Patient ${patientId} not found`);

    const newCredit = parseFloat(patient.prepaidCredit || 0) + parseFloat(amount);
    await Patient.update(
        { prepaidCredit: newCredit },
        { where: { id: patientId }, transaction }
    );

    // Recalculate and persist balance
    return updatePatientBalance(patientId, transaction);
};

module.exports = { updatePatientBalance, addPrepaidCredit };
