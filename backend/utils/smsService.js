/**
 * smsService - Twilio SMS API wrapper.
 * Required env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE_NUMBER (e.g. +1234567890)
 */

const twilio = require('twilio');

const sendSuspensionSMS = async (patient) => {
    try {
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
            console.warn('[SMS] Twilio credentials not fully configured - skipping SMS.');
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

        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const message = await client.messages.create({
            body: `Dear ${patient.firstName} ${patient.lastName}, your MedFinance360 account has been SUSPENDED. Services are temporarily unavailable. Please contact the accounts office for assistance.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: normalizedPhone
        });

        console.log(`[SMS] Suspension SMS sent to ${normalizedPhone}. SID: ${message.sid}`);
        return { success: true, sid: message.sid, status: message.status };

    } catch (err) {
        // Never block the main flow for SMS failures
        console.error('[SMS] Failed to send suspension SMS via Twilio:', err.message);
        return { error: err.message };
    }
};

module.exports = {
    sendSuspensionSMS
};
