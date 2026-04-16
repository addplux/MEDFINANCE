const { Scheme } = require('../models');

async function checkSchemes() {
    try {
        const schemes = await Scheme.findAll();
        console.log('--- SCHEMES DISCOVERY ---');
        console.log(`Found ${schemes.length} schemes.`);
        schemes.forEach(s => {
            console.log(`- ${s.schemeName}: Type [${s.schemeType}], Status [${s.status}]`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error fetching schemes:', error);
        process.exit(1);
    }
}

checkSchemes();
