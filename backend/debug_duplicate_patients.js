require('dotenv').config();
const { Patient, sequelize } = require('./models');
const { Op } = require('sequelize');

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
        
        console.log(`Found ${patients.length} patients with name Mujala`);
        console.log(patients.map(p => ({
            id: p.id,
            patientNumber: p.patientNumber,
            firstName: p.firstName,
            lastName: p.lastName
        })));
        
    } catch (err) {
        console.error('Error debugging:', err);
    } finally {
        await sequelize.close();
    }
}

debug();
