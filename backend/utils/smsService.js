/**
 * smsService — MTN Developer API (Zambia) SMS wrapper.
 *
 * Uses OAuth2 Client Credentials flow:
 *   1. Exchange Consumer Key + Secret for an access token
 *   2. Use token to send SMS via MTN SMS v3 API
 *
 * Required env vars (set in Vercel → Settings → Environment Variables):
 *   MTN_CONSUMER_KEY      — Consumer Key from developers.mtn.com
 *   MTN_CONSUMER_SECRET   — Consumer Secret from developers.mtn.com
 *   MTN_SENDER_ID         — Sender ID / short code (optional, e.g. "MEDFINANCE")
 */

const https = require('https');

/**
 * Get MTN OAuth2 access token using client credentials grant.
 * @returns {Promise<string>} access_token
 */
const getMtnAccessToken = async () => {
    const consumerKey = process.env.MTN_CONSUMER_KEY;
    const consumerSecret = process.env.MTN_CONSUMER_SECRET;

    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    return new Promise((resolve, reject) => {
        const body = 'grant_type=client_credentials';
        const options = {
            hostname: 'api.mtn.com',
            port: 443,
            path: '/v1/oauth/access_token?grant_type=client_credentials',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.access_token) resolve(json.access_token);
                    else reject(new Error(`No access_token in response: ${data}`));
                } catch (e) {
                    reject(new Error(`Failed to parse token response: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
};

/**
 * Send SMS via MTN SMS v3 API.
 */
const sendMtnSms = async (token, to, message, senderId) => {
    const payload = JSON.stringify({
        senderAddress: senderId || 'MEDFINANCE',
        receiverAddress: [to],
        message,
        clientCorrelatorId: `MEDF-${Date.now()}`
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.mtn.com',
            port: 443,
            path: '/v3/sms/messages/sms/outbound',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[SMS] MTN response (${res.statusCode}):`, data);
                resolve({ statusCode: res.statusCode, body: data });
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
};

/**
 * Send suspension SMS to a patient.
 * @param {object} patient  Patient object with { id, firstName, lastName, phone }
 */
const sendSuspensionSMS = async (patient) => {
    try {
        if (!process.env.MTN_CONSUMER_KEY || !process.env.MTN_CONSUMER_SECRET) {
            console.warn('[SMS] MTN_CONSUMER_KEY / MTN_CONSUMER_SECRET not configured — skipping SMS.');
            return { skipped: true };
        }

        const phone = patient.phone;
        if (!phone) {
            console.warn(`[SMS] Patient ${patient.id} has no phone number — skipping SMS.`);
            return { skipped: true };
        }

        // Normalize phone to +260XXXXXXXXX (Zambia country code)
        let normalizedPhone = String(phone).replace(/\s+/g, '');
        if (normalizedPhone.startsWith('0')) normalizedPhone = '+260' + normalizedPhone.slice(1);
        if (!normalizedPhone.startsWith('+')) normalizedPhone = '+260' + normalizedPhone;

        const message =
            `Dear ${patient.firstName} ${patient.lastName}, your MedFinance360 account has been SUSPENDED. ` +
            `Services are temporarily unavailable. Please contact the accounts office for assistance.`;

        const token = await getMtnAccessToken();
        const result = await sendMtnSms(token, normalizedPhone, message, process.env.MTN_SENDER_ID);

        console.log(`[SMS] Suspension SMS sent to ${normalizedPhone}`);
        return result;

    } catch (err) {
        // Never block the main flow for SMS failures
        console.error('[SMS] Failed to send suspension SMS:', err.message);
        return { error: err.message };
    }
};

module.exports = { sendSuspensionSMS };
