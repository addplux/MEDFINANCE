require('dotenv').config();
const { sendSuspensionSMS } = require('./utils/smsService');

async function testSMS() {
    console.log("Testing Africa's Talking SMS integration...");

    if (!process.env.AT_API_KEY) {
        console.warn('⚠️ AT_API_KEY not found in .env');
        console.log('Please define AT_API_KEY and AT_USERNAME in your local .env or Railway/Vercel config.');

        // For testing right now, you can uncomment these and paste your keys from the sandbox:
        // process.env.AT_API_KEY = 'YOUR_API_KEY';
        // process.env.AT_USERNAME = 'sandbox'; 
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
