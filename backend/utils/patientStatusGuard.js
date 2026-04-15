const { Visit } = require('../models');

/**
 * patientStatusGuard — throws a structured error if patient account is suspended or closed.
 * Also blocks services if a "Bypass" patient has a pending registration fee.
 * Use this at the top of every billing "create" function after fetching the patient.
 *
 * @param {object} patient  Sequelize Patient instance or plain object with { id, memberStatus, firstName, lastName }
 * @throws {Error} with a user-friendly message and a .statusCode property
 */
async function assertPatientActive(patient) {
    if (!patient) return; // caller should handle not-found separately

    const status = patient.memberStatus;

    if (status === 'suspended') {
        const err = new Error(
            `Account for ${patient.firstName} ${patient.lastName} is SUSPENDED and cannot receive services. Please contact the accounts office.`
        );
        err.statusCode = 403;
        err.code = 'ACCOUNT_SUSPENDED';
        throw err;
    }

    if (status === 'closed') {
        const err = new Error(
            `Account for ${patient.firstName} ${patient.lastName} is CLOSED and cannot receive services.`
        );
        err.statusCode = 403;
        err.code = 'ACCOUNT_CLOSED';
        throw err;
    }

    // AUTOMATIC "RED" STATUS: Block overdrawn prepaid accounts
    if (patient.paymentMethod === 'private_prepaid' && parseFloat(patient.balance || 0) < 0) {
        const err = new Error(
            `CREDIT STOP: The prepaid account for ${patient.firstName} ${patient.lastName} is in the RED (K${Math.abs(parseFloat(patient.balance)).toFixed(2)} debt). Please top up before receiving further services.`
        );
        err.statusCode = 403;
        err.code = 'RED_ACCOUNT';
        throw err;
    }

    // MANDATORY BYPASS FEE CHECK
    // If the latest active visit for this patient has a pending registry fee, block services.
    const activeVisit = await Visit.findOne({
        where: {
            patientId: patient.id,
            status: 'active'
        },
        order: [['createdAt', 'DESC']]
    });

    if (activeVisit && activeVisit.registryFeeStatus === 'pending') {
        const err = new Error(
            `SERVICES LOCKED: ${patient.firstName} ${patient.lastName} has a pending registration fee of K${parseFloat(activeVisit.registryFee).toFixed(2)}. Please pay at the cashier to unlock services.`
        );
        err.statusCode = 403;
        err.code = 'REGISTRY_FEE_PENDING';
        throw err;
    }
}

module.exports = { assertPatientActive };
