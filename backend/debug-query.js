const { Patient, sequelize } = require('./models');
const Op = sequelize.Sequelize.Op;

async function debugQuery() {
    try {
        const startDate = '2025-12-31';
        const endDate = '2026-04-15';
        
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        console.log('Start date object:', start);
        console.log('End date object:', end);
        
        const count = await Patient.count({
            where: {
                createdAt: {
                    [Op.between]: [start, end]
                }
            }
        });
        
        console.log('Count for range:', count);
        
        const allPatients = await Patient.findAll({ limit: 5 });
        allPatients.forEach(p => {
            console.log(`Patient ID: ${p.id}, Name: ${p.firstName}, CreatedAt: ${p.createdAt}`);
        });
        
    } catch (error) {
        console.error('Debug query error:', error);
    } finally {
        process.exit();
    }
}

debugQuery();
