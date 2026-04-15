const { Patient, Visit, Scheme, sequelize } = require('./models');

async function simulate() {
    try {
        const startDate = '2025-12-31'; 
        const endDate = '2026-04-15';   
        const limit = 100;

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        console.log(`Simulating with: start=${start.toISOString()}, end=${end.toISOString()}`);

        const { Op } = require('sequelize');
        const patients = await Patient.findAll({
            where: {
                createdAt: {
                    [Op.between]: [start, end]
                }
            },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            logging: (sql) => console.log(`[SQL] ${sql}`)
        });

        console.log(`Simulation found: ${patients.length} patients`);
        if (patients.length > 0) {
             console.log(`First patient: ${patients[0].firstName} (ID: ${patients[0].id})`);
        }

    } catch (e) {
        console.error('Simulation Error:', e);
    }
    process.exit(0);
}
simulate();
