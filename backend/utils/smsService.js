/**
 * smsService — Africa's Talking SMS wrapper.
 *
 * Requires env vars:
 *   AT_API_KEY    — Africa's Talking API key
 *   AT_USERNAME   — Africa's Talking username (use 'sandbox' for testing)
 *   AT_SENDER_ID  — Optional short/sender ID (leave blank to use default)
 *
 * Install: npm install africastalking
 */

const sendSuspensionSMS = async (patient) => {
    try {
        if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
            console.warn('[SMS] AT_API_KEY / AT_USERNAME not configured — skipping SMS.');
            return { skipped: true };
        }

        const phone = patient.phone;
        if (!phone) {
            console.warn(`[SMS] Patient ${patient.id} has no phone number — skipping SMS.`);
            return { skipped: true };
        }

        const AfricasTalking = require('africastalking');
        const at = AfricasTalking({
            apiKey: process.env.AT_API_KEY,
            username: process.env.AT_USERNAME,
        });

        const sms = at.SMS;

        // Normalize phone: ensure it starts with country code (260 for Zambia)
        let normalizedPhone = phone.replace(/\s+/g, '').replace(/^0/, '+260');
        if (!normalizedPhone.startsWith('+')) normalizedPhone = `+260${normalizedPhone}`;

        const message =
            `Dear ${patient.firstName} ${patient.lastName}, your MedFinance360 account has been SUSPENDED. ` +
            `Services are temporarily unavailable. Please contact the accounts office for assistance.`;

        const options = {
            to: [normalizedPhone],
            message,
        };

        if (process.env.AT_SENDER_ID) {
            options.from = process.env.AT_SENDER_ID;
        }

        const result = await sms.send(options);
        console.log(`[SMS] Suspension SMS sent to ${normalizedPhone}:`, JSON.stringify(result));
        return result;
    } catch (err) {
        // Never block the main flow for SMS failures
        console.error('[SMS] Failed to send suspension SMS:', err.message);
        return { error: err.message };
    }
};

module.exports = { sendSuspensionSMS };
