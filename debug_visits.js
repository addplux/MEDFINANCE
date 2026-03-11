require('dotenv').config({ path: 'backend/.env' });
const { Visit, Department } = require('./backend/models');
const { Op } = require('sequelize');

async function debugQueue() {
  try {
    const visits = await Visit.findAll({
      where: { status: 'active' },
      attributes: ['id', 'patientId', 'departmentId', 'assignedDepartment', 'queueStatus'],
      include: [{ model: Department, as: 'department', attributes: ['id', 'departmentName', 'departmentCode'] }]
    });

    console.log('--- ALL ACTIVE VISITS ---');
    visits.forEach(v => {
      console.log(`Visit ID: ${v.id}, Patient ID: ${v.patientId}, Dept ID: ${v.departmentId}, Assigned: ${v.assignedDepartment}, Queue Status: ${v.queueStatus}, Dept Name: ${v.department?.departmentName || 'N/A'}`);
    });

    const pharmDept = await Department.findOne({
      where: {
        [Op.or]: [
          { departmentName: { [Op.iLike]: '%pharmacy%' } },
          { departmentCode: { [Op.iLike]: '%PHARM%' } }
        ]
      }
    });

    console.log('\n--- PHARMACY DEPARTMENT INFO ---');
    console.log(pharmDept ? JSON.stringify(pharmDept, null, 2) : 'Pharmacy Department NOT FOUND');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

debugQueue();
