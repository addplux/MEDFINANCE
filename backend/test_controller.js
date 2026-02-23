const { getAllSchemes } = require('./controllers/receivablesController');

async function test() {
    const req = { query: { status: 'active' } };
    const res = {
        json: (data) => {
            console.log('--- Controller Result ---');
            console.log(JSON.stringify(data, null, 2));
            process.exit(0);
        },
        status: (code) => ({
            json: (data) => {
                console.log(`--- Controller Error (${code}) ---`);
                console.log(JSON.stringify(data, null, 2));
                process.exit(1);
            }
        })
    };

    try {
        await getAllSchemes(req, res);
    } catch (error) {
        console.error('Fatal test error:', error);
        process.exit(1);
    }
}

test();
