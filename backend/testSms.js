require('dotenv').config();
const { sendSuspensionSMS } = require('./utils/smsService');

async function testSMS() {
    console.log("Testing Twilio SMS integration...");

    if (!process.env.TWILIO_ACCOUNT_SID) {
        console.warn('⚠️ TWILIO_ACCOUNT_SID not found in .env');
        console.log('Please define TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your local .env or Railway/Vercel config.');

        // For testing right now, you can uncomment these and paste your keys from the Twilio Console:
        // process.env.TWILIO_ACCOUNT_SID = 'AC...';
        // process.env.TWILIO_AUTH_TOKEN = '...'; 
        // process.env.TWILIO_PHONE_NUMBER = '+1...'; // A valid Twilio number or messaging service SID
    }

    const testPatient = {
        id: 999,
        firstName: 'Test',
        lastName: 'Patient',
        // Replace this with your actual phone number to receive the test SMS
        phone: '0977621498'
    };

    console.log(`Sending test SMS to ${testPatient.phone}...`);
    const result = await sendSuspensionSMS(testPatient);

    console.log('\n--- Test Result ---');
    console.log(result);
    console.log('-------------------\n');
}

testSMS();
