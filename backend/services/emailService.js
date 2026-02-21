/**
 * MEDFINANCE360 Email Service
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // We'll try to initialize from environment variables
        // Fallback to a test sandbox or do nothing if not configured
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            auth: {
                user: process.env.SMTP_USER || 'test-user',
                pass: process.env.SMTP_PASS || 'test-pass'
            }
        });
    }

    /**
     * Send an email
     * @param {string} to - Recipient email address
     * @param {string} subject - Email subject
     * @param {string} text - Plain text body
     * @param {string} html - HTML body
     */
    async sendEmail(to, subject, text, html) {
        try {
            // Check if email service is actually configured. 
            // If it's the fallback test-user, we just mock the send to prevent crashes in dev.
            if ((process.env.SMTP_USER || 'test-user') === 'test-user') {
                console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
                return { success: true, messageId: 'mock-id' };
            }

            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || '"MEDFINANCE360" <billing@medfinance360.com>',
                to,
                subject,
                text,
                html
            });

            console.log(`Email sent: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
