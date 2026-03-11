const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { Visit, Department, Patient } = require('./backend/models');
const { Op } = require('sequelize');

async function checkPharmacyQueue() {
    let report = '';
    const log = (msg) => {
        console.log(msg);
        report += msg + '\n';
    };

    try {
        const departments = await Department.findAll();
        log('All Departments:');
        departments.forEach(d => log(`- ID ${d.id}: ${d.departmentName} (${d.departmentCode})`));

        const pharmDept = await Department.findOne({
            where: {
                [Op.or]: [
                    { departmentName: { [Op.iLike]: '%pharmacy%' } },
                    { departmentCode: 'PHARM' }
                ]
            }
        });

        log(`\nDetected Pharmacy Department: ${pharmDept ? `ID ${pharmDept.id} (${pharmDept.departmentName})` : 'Not found'}`);

        const activeVisits = await Visit.findAll({
            where: { status: 'active' },
            include: [
                { model: Department, as: 'department' },
                { model: Patient, as: 'patient' }
            ]
        });

        log(`\nFound ${activeVisits.length} total active visits:`);
        activeVisits.forEach(v => {
            log(`- Visit ${v.visitNumber}: Patient ${v.patient?.firstName} ${v.patient?.lastName}, Dept: ${v.department?.departmentName || 'None'} (ID: ${v.departmentId}), AssignedDept: ${v.assignedDepartment || 'None'}, Status: ${v.status}, Queue: ${v.queueStatus}`);
        });

        // Test the exact logic used in getPharmacyQueue
        const where = {
            status: 'active'
        };

        if (pharmDept) {
            where[Op.or] = [
                { assignedDepartment: { [Op.iLike]: '%pharmacy%' } },
                { departmentId: pharmDept.id }
            ];
        } else {
            where.assignedDepartment = { [Op.iLike]: '%pharmacy%' };
        }

        const visitsInPharm = await Visit.findAll({
            where,
            include: [{ model: Patient, as: 'patient' }]
        });

        log(`\nVisits matching Pharmacy Queue criteria (Logic in billingController): ${visitsInPharm.length}`);
        visitsInPharm.forEach(v => {
            log(`- ${v.visitNumber} (${v.patient?.firstName} ${v.patient?.lastName})`);
        });

        fs.writeFileSync('pharmacy_diagnostic.txt', report);
        log('\nReport written to pharmacy_diagnostic.txt');

    } catch (error) {
        log('Error: ' + error.message);
        log(error.stack);
    } finally {
        process.exit(0);
    }
}

checkPharmacyQueue();
