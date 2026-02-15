/**
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

const { AuditLog } = require('../models');

/**
 * Creates an audit log entry
 * @param {Object} params - The parameters for the audit log
 * @param {number} params.userId - ID of the user performing the action
 * @param {string} params.action - Action performed (create, update, delete, login, logout)
 * @param {string} params.tableName - Name of the table affected
 * @param {number} params.recordId - ID of the record affected
 * @param {Object} [params.changes] - JSON object describing the changes
 * @param {Object} [params.req] - Express request object to extract IP and User Agent
 * @param {Object} [params.transaction] - Sequelize transaction object
 */
const logAudit = async ({ userId, action, tableName, recordId, changes = null, req = null, transaction = null }) => {
    try {
        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
        const userAgent = req ? req.headers['user-agent'] : null;

        await AuditLog.create({
            userId,
            action,
            tableName,
            recordId,
            changes,
            ipAddress,
            userAgent
        }, { transaction });
    } catch (error) {
        // We generally don't want audit logging to break the main application flow,
        // so we log the error but don't rethrow it unless critical.
        console.error('Audit logging failed:', error);
    }
};

module.exports = logAudit;
