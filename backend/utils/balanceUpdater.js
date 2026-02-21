const { Patient, OPDBill, PharmacyBill, LabBill, RadiologyBill,
    MaternityBill, TheatreBill, SpecialistClinicBill, Payment, LabRequest } = require('../models');

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

        // Sum standard bill models (netAmount or totalAmount)
        const billModels = [OPDBill, PharmacyBill, LabBill, RadiologyBill];
        try { billModels.push(require('../models').MaternityBill); } catch (_) { }
        try { billModels.push(require('../models').TheatreBill); } catch (_) { }
        try { billModels.push(require('../models').SpecialistClinicBill); } catch (_) { }

        let totalBilled = 0;
        let totalPlanSpend = 0; // Total usage against plan coverage limit

        const isPrepaid = patient.paymentMethod === 'private_prepaid';
        const start = patient.planStartDate;
        const end = patient.planEndDate;

        for (const Model of billModels) {
            if (!Model || !Model.sum) continue;
            const field = Model.rawAttributes?.netAmount ? 'netAmount' : 'totalAmount';

            // Standard sum for balance
            const sum = await Model.sum(field, { where: { patientId }, transaction });
            totalBilled += (sum || 0);

            // Sum for plan coverage tracking (only if within dates)
            if (isPrepaid && (start || end)) {
                const dateWhere = { patientId };
                if (start && end) {
                    dateWhere.createdAt = { [require('sequelize').Op.between]: [new Date(start), new Date(new Date(end).setHours(23, 59, 59, 999))] };
                } else if (start) {
                    dateWhere.createdAt = { [require('sequelize').Op.gte]: new Date(start) };
                } else if (end) {
                    dateWhere.createdAt = { [require('sequelize').Op.lte]: new Date(new Date(end).setHours(23, 59, 59, 999)) };
                }
                const planSum = await Model.sum(field, { where: dateWhere, transaction });
                totalPlanSpend += (planSum || 0);
            }
        }

        // Also sum LabRequest.totalAmount (lab module uses requests not LabBills)
        const labRequestTotal = await LabRequest.sum('totalAmount', { where: { patientId }, transaction });
        totalBilled += (labRequestTotal || 0);

        if (isPrepaid && (start || end)) {
            const dateWhere = { patientId };
            if (start && end) {
                dateWhere.createdAt = { [require('sequelize').Op.between]: [new Date(start), new Date(new Date(end).setHours(23, 59, 59, 999))] };
            } else if (start) {
                dateWhere.createdAt = { [require('sequelize').Op.gte]: new Date(start) };
            } else if (end) {
                dateWhere.createdAt = { [require('sequelize').Op.lte]: new Date(new Date(end).setHours(23, 59, 59, 999)) };
            }
            const labPlanSum = await LabRequest.sum('totalAmount', { where: dateWhere, transaction });
            totalPlanSpend += (labPlanSum || 0);
        }

        let newBalance;

        if (isPrepaid) {
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
            { balance: newBalance, totalPlanSpend },
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
