require('dotenv').config();
const { Patient, sequelize } = require('./models');

async function getStats() {
    try {
        const total = await Patient.count();
        console.log(`TOTAL_PATIENTS=${total}`);

        const byRank = await sequelize.query(`
            SELECT COALESCE("member_rank"::text, 'NULL_RANK') as rank, COUNT(*) as count 
            FROM patients 
            GROUP BY "member_rank"
            ORDER BY count DESC
        `, { type: sequelize.QueryTypes.SELECT });
        
        for (const row of byRank) {
            console.log(`RANK_${row.rank}=${row.count}`);
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        process.exit(0);
    }
}
getStats();
