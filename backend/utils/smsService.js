/**
 * smsService - Africa's Talking SMS API wrapper.
 * Required env vars:
 *   AT_API_KEY
 *   AT_USERNAME
 *   AT_SENDER_ID (optional)
 */

const sendSuspensionSMS = async (patient) => {
    try {
        if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
            console.warn('[SMS] AT_API_KEY or AT_USERNAME not configured - skipping SMS.');
            return { skipped: true };
        }

        const phone = patient.phone;
        if (!phone) {
            console.warn(`[SMS] Patient ${patient.id} has no phone number - skipping SMS.`);
            return { skipped: true };
        }

        // Normalize phone to +260XXXXXXXXX (Zambia country code)
        let normalizedPhone = String(phone).replace(/\s+/g, '');
        if (normalizedPhone.startsWith('0')) normalizedPhone = '+260' + normalizedPhone.slice(1);
        if (!normalizedPhone.startsWith('+')) normalizedPhone = '+260' + normalizedPhone;

        const credentials = {
            apiKey: process.env.AT_API_KEY,
            username: process.env.AT_USERNAME,
        };
        const AfricasTalking = require('africastalking')(credentials);
        const sms = AfricasTalking.SMS;

        const options = {
            to: [normalizedPhone],
            message: `Dear ${patient.firstName} ${patient.lastName}, your MedFinance360 account has been SUSPENDED. Services are temporarily unavailable. Please contact the accounts office for assistance.`
        };

        if (process.env.AT_SENDER_ID) {
            options.from = process.env.AT_SENDER_ID;
        }

        const result = await sms.send(options);
        console.log(`[SMS] Suspension SMS sent to ${normalizedPhone}`);
        return result;

    } catch (err) {
        // Never block the main flow for SMS failures
        console.error('[SMS] Failed to send suspension SMS:', err);
        return { error: err.message };
    }
};

module.exports = {
    sendSuspensionSMS
};
