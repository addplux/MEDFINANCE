/**
 * MEDFINANCE360 Wait Times Job
 * Author: Lubuto Chabusha
 * Developed: 2026
 * 
 * Checks the waiting room for patients waiting more than 30 minutes
 * and sends alerts to doctors and nurses.
 */

const { Visit, Patient, User, Notification } = require('../models');
const { Op } = require('sequelize');

const checkWaitTimes = async () => {
    try {
        console.log('⏳ Running Wait Times Check Job...');
        const thresholdMinutes = 30;
        const thresholdDate = new Date(Date.now() - thresholdMinutes * 60000);

        // Find active visits pending triage or waiting for doctor
        const waitingVisits = await Visit.findAll({
            where: {
                status: 'active',
                queueStatus: {
                    [Op.in]: ['pending_triage', 'waiting_doctor']
                },
                updatedAt: {
                    [Op.lt]: thresholdDate // Last status update was > 30 mins ago
                }
            },
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] }
            ]
        });

        if (waitingVisits.length === 0) {
            console.log('✅ Wait Times Check: No long-waiting patients found.');
            return;
        }

        console.log(`⚠️ Wait Times Check: Found ${waitingVisits.length} patients waiting > 30 mins.`);

        // Find relevant staff (doctors and nurses) to notify
        const clinicalStaff = await User.findAll({
            where: {
                role: {
                    [Op.in]: ['doctor', 'nurse', 'superintendent']
                },
                isActive: true,
                status: 'approved'
            },
            attributes: ['id']
        });

        if (clinicalStaff.length === 0) {
            console.log('⚠️ Wait Times Check: No active clinical staff found to notify.');
            return;
        }

        let alertsCreated = 0;

        for (const visit of waitingVisits) {
            const waitTimeInfo = Math.floor((Date.now() - new Date(visit.updatedAt)) / 60000);
            const stageName = visit.queueStatus === 'pending_triage' ? 'Triage' : 'Consultation';

            // Check if alert exists
            const existingAlert = await Notification.findOne({
                where: {
                    type: 'wait_time_alert',
                    metadata: {
                        [Op.contains]: {
                            visitId: visit.id,
                            queueStatus: visit.queueStatus
                        }
                    }
                }
            });

            if (existingAlert) {
                continue; // Skip, already alerted for this stage
            }

            // Create notification for ALL clinical staff
            const notificationsToCreate = clinicalStaff.map(staff => ({
                userId: staff.id,
                type: 'wait_time_alert',
                title: 'Extended Wait Time Alert',
                message: `Patient ${visit.patient.firstName} ${visit.patient.lastName} (${visit.patient.patientNumber}) has been waiting for ${stageName} for over ${waitTimeInfo} minutes.`,
                isRead: false,
                metadata: {
                    visitId: visit.id,
                    queueStatus: visit.queueStatus,
                    waitTime: waitTimeInfo
                }
            }));

            await Notification.bulkCreate(notificationsToCreate);
            alertsCreated++;
        }

        console.log(`✅ Wait Times Check: Created alerts for ${alertsCreated} patients.`);

    } catch (error) {
        console.error('❌ Wait Times Check Job Error:', error);
    }
};

module.exports = {
    checkWaitTimes
};
