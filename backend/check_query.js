const { Patient, sequelize } = require('./models');
(async () => {
    try {
        console.log('--- Testing Patient.findAndCountAll ---');
        const res = await Patient.findAndCountAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM visits AS v
                            WHERE v.patient_id = "Patient".id
                        )`),
                        'totalVisits'
                    ]
                ]
            },
            limit: 5,
            order: [['createdAt', 'DESC']],
            logging: (sql) => console.log('Generated SQL:', sql)
        });
        console.log('Result count:', res.count);
        console.log('Rows found:', res.rows.length);
        if (res.rows.length > 0) {
            console.log('First row data:', JSON.stringify(res.rows[0].toJSON(), null, 2));
        }
    } catch (e) {
        console.error('FAILED with error:', e.message);
        if (e.original) {
            console.error('Original DB error:', e.original.message);
        }
    } finally {
        process.exit();
    }
})();
