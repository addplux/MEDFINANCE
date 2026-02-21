/**
 * MEDFINANCE360 SMS Service
 * A mock SMS sender meant to be extended with a real provider 
 * (like Africa's Talking, Twilio, or RouteSMS) in the future.
 */

class SMSService {
    constructor() {
        this.provider = process.env.SMS_PROVIDER || 'mock';
    }

    /**
     * Send an SMS message
     * @param {string} to - Recipient phone number (e.g., +26097...)
     * @param {string} message - The text message to send
     */
    async sendSMS(to, message) {
        try {
            if (this.provider === 'mock') {
                console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
                return { success: true, messageId: `mock-sms-${Date.now()}` };
            }

            // TODO: Implement actual SMS provider HTTP call here
            // const response = await axios.post('API_URL', { to, message, apiKey: ... });

            console.warn(`SMS Provider ${this.provider} is not fully implemented yet.`);
            return { success: false, error: 'Provider not implemented' };

        } catch (error) {
            console.error('Error sending SMS:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new SMSService();
