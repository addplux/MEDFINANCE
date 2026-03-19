require('dotenv').config();
const { Patient, sequelize } = require('./models');
const { Op } = require('sequelize');
const fs = require('fs');

async function debug() {
    try {
        const patients = await Patient.findAll({
            where: {
                [Op.or]: [
                    { firstName: { [Op.iLike]: '%mujala%' } },
                    { lastName: { [Op.iLike]: '%mujala%' } }
                ]
            }
        });
        
        const data = patients.map(p => ({
            id: p.id,
            patientNumber: p.patientNumber,
            firstName: p.firstName,
            lastName: p.lastName,
            balance: p.balance
        }));
        
        fs.writeFileSync('mujala_data.json', JSON.stringify(data, null, 2));
        console.log(`Wrote ${data.length} patients to mujala_data.json`);
        
    } catch (err) {
        console.error('Error debugging:', err);
    } finally {
        await sequelize.close();
    }
}

debug();
