/**
 * patientStatusGuard — throws a structured error if patient account is suspended or closed.
 * Use this at the top of every billing "create" function after fetching the patient.
 *
 * @param {object} patient  Sequelize Patient instance or plain object with { memberStatus, firstName, lastName }
 * @throws {Error} with a user-friendly message and a .statusCode property
 */
function assertPatientActive(patient) {
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
}

module.exports = { assertPatientActive };
