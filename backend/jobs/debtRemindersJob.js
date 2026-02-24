/**
 * MEDFINANCE360 Automated Debt Reminders Job
 * Checks for overdue AR balances and sends email/sms reminders.
 */

const { Patient, OPDBill, IPDBill, Payment, ARReminderLog, sequelize } = require('../models');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// Buckets to check (in days)
const AGING_BUCKETS = [30, 60, 90];

const checkAndSendReminders = async () => {
    console.log('[CRON] Starting Debt Reminders Job...');

    try {
        // 1. Get all patients who might have balances (we only target external payers and patients)
        const paymentMethods = ['corporate', 'scheme', 'cash'];
        const patients = await Patient.findAll({
            where: {
                paymentMethod: {
                    [sequelize.Sequelize.Op.in]: paymentMethods
                }
            }
        });

        const today = new Date();

        for (const patient of patients) {
            // Calculate patient's active bills
            const opdBills = await OPDBill.findAll({ where: { patientId: patient.id }, order: [['createdAt', 'DESC']] });
            const ipdBills = await IPDBill.findAll({ where: { patientId: patient.id }, order: [['createdAt', 'DESC']] });

            const allBills = [...opdBills, ...ipdBills].map(b => ({
                id: b.id,
                type: b.billNumber ? 'OPD' : 'IPD',
                amount: parseFloat(b.netAmount || b.totalAmount),
                date: b.createdAt
            })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

            const totalBilled = allBills.reduce((sum, b) => sum + b.amount, 0);

            const totalPaid = await Payment.sum('amount', {
                where: { patientId: patient.id }
            }) || 0;

            let outstandingBalance = totalBilled - parseFloat(totalPaid);

            if (outstandingBalance > 0) {
                let remainingToAllocate = outstandingBalance;
                const bucketsTriggered = new Set();

                for (const bill of allBills) {
                    if (remainingToAllocate <= 0) break;

                    const amountForThisBill = Math.min(bill.amount, remainingToAllocate);

                    // Only care if amount > 0
                    if (amountForThisBill > 0) {
                        // Calculate age of the bill
                        const ageInDays = Math.floor((today - new Date(bill.date)) / (1000 * 60 * 60 * 24));

                        // Check which bucket this bill falls into
                        let currentBucket = null;
                        if (ageInDays >= 90) currentBucket = 90;
                        else if (ageInDays >= 60) currentBucket = 60;
                        else if (ageInDays >= 30) currentBucket = 30;

                        if (currentBucket && !bucketsTriggered.has(currentBucket)) {
                            // Have we already sent a reminder for this bucket?
                            const existingLog = await ARReminderLog.findOne({
                                where: {
                                    patientId: patient.id,
                                    agingBucket: currentBucket
                                }
                            });

                            if (!existingLog) {
                                bucketsTriggered.add(currentBucket);

                                console.log(`[CRON] Generating ${currentBucket}-day reminder for Patient #${patient.id} (${patient.firstName} ${patient.lastName}). Balance: K${amountForThisBill.toFixed(2)}`);

                                // Prepare message
                                const subject = `Overdue Account Notice - ${currentBucket} Days`;
                                const messageText = `Dear ${patient.firstName} ${patient.lastName},\n\n` +
                                    `This is a reminder that you have an outstanding balance of K${amountForThisBill.toFixed(2)} ` +
                                    `that is ${currentBucket} days overdue at MEDFINANCE360. ` +
                                    `Please settle this amount as soon as possible.`;

                                let sentEmail = false;
                                let sentSms = false;

                                // Send Email
                                if (patient.email) {
                                    const emailRes = await emailService.sendEmail(patient.email, subject, messageText, `<p>${messageText.replace(/\n/g, '<br>')}</p>`);
                                    if (emailRes.success) sentEmail = true;
                                }

                                // Send SMS
                                if (patient.phone) {
                                    const smsMessage = `MEDFINANCE360 Alert: You have an overdue balance of K${amountForThisBill.toFixed(2)} (${currentBucket} days). Please clear this soon.`;
                                    const smsRes = await smsService.sendSMS(patient.phone, smsMessage);
                                    if (smsRes.success) sentSms = true;
                                }

                                // Log the reminder
                                if (sentEmail || sentSms) {
                                    await ARReminderLog.create({
                                        patientId: patient.id,
                                        paymentMethod: patient.paymentMethod,
                                        agingBucket: currentBucket,
                                        reminderType: sentEmail && sentSms ? 'both' : (sentEmail ? 'email' : 'sms'),
                                        status: 'success'
                                    });
                                } else {
                                    console.log(`[CRON] Skipped reminder for Patient #${patient.id} - No valid email or phone number.`);
                                }
                            }
                        }
                    }

                    remainingToAllocate -= amountForThisBill;
                }
            }
        }

        console.log('[CRON] Debt Reminders Job completed successfully.');
    } catch (error) {
        console.error('[CRON] Error running Debt Reminders Job:', error);
    }
};

module.exports = {
    checkAndSendReminders
};
