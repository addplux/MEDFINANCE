const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { PharmacyBill, Patient, Visit } = require('./backend/models');

async function checkPharmacyBills() {
    try {
        const unpaidBills = await PharmacyBill.findAll({
            where: { paymentStatus: 'unpaid' },
            include: [{ association: 'patient' }]
        });

        console.log(`Found ${unpaidBills.length} unpaid pharmacy bills:`);
        for (const b of unpaidBills) {
            console.log(`- Bill ID ${b.id}: Patient ${b.patient?.firstName} ${b.patient?.lastName}, Amount: ${b.netAmount || b.totalAmount}, Status: ${b.paymentStatus}, VisitID: ${b.visitId}`);

            if (b.visitId) {
                const visit = await Visit.findByPk(b.visitId);
                console.log(`  Associated Visit: ${visit?.visitNumber}, Status: ${visit?.status}, Dept: ${visit?.departmentId}, AssignedDept: ${visit?.assignedDepartment}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkPharmacyBills();
