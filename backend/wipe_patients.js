/**
 * MEDFINANCE360 — Patient Data Wipe Script
 * ----------------------------------------
 * Deletes ALL patient-related records in safe dependency order.
 * PRESERVES: Users, Roles, Schemes, Services, Departments,
 *            Suppliers, Ledger, Budgets, Funds, Organization.
 *
 * Run with: node wipe_patients.js
 */

const { sequelize } = require('./config/database');
const {
    LabResult, LabRequest,
    Vitals, PatientMovement,
    OPDBill, IPDBill, PharmacyBill, LabBill,
    RadiologyBill, TheatreBill, MaternityBill, SpecialistClinicBill,
    Payment, Refund,
    Admission,
    FileRequest,
    ARReminderLog,
    OnlineTransaction,
    Visit,
    Notification,
    Patient
} = require('./models');

async function wipePatients() {
    const t = await sequelize.transaction();
    try {
        console.log('🚨 Starting patient data wipe...\n');

        // 1. Lab Results (depend on LabRequest)
        const lr = await LabResult.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ LabResults deleted: ${lr}`);

        // 2. Lab Requests (depend on Patient)
        const lreq = await LabRequest.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ LabRequests deleted: ${lreq}`);

        // 3. Vitals (depend on Visit)
        const vt = await Vitals.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ Vitals deleted: ${vt}`);

        // 4. Patient Movements
        const pm = await PatientMovement.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ PatientMovements deleted: ${pm}`);

        // 5. Refunds (depend on Payment)
        const rf = await Refund.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ Refunds deleted: ${rf}`);

        // 6. All billing tables
        const opd = await OPDBill.destroy({ where: {}, truncate: false, transaction: t });
        const ipd = await IPDBill.destroy({ where: {}, truncate: false, transaction: t });
        const pharma = await PharmacyBill.destroy({ where: {}, truncate: false, transaction: t });
        const lab = await LabBill.destroy({ where: {}, truncate: false, transaction: t });
        const radio = await RadiologyBill.destroy({ where: {}, truncate: false, transaction: t });
        const theatre = await TheatreBill.destroy({ where: {}, truncate: false, transaction: t });
        const mat = await MaternityBill.destroy({ where: {}, truncate: false, transaction: t });
        const spec = await SpecialistClinicBill.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ Bills deleted — OPD:${opd} IPD:${ipd} Pharmacy:${pharma} Lab:${lab} Radiology:${radio} Theatre:${theatre} Maternity:${mat} Specialist:${spec}`);

        // 7. Payments linked to patients
        const pays = await Payment.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ Payments deleted: ${pays}`);

        // 8. Admissions
        const adm = await Admission.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ Admissions deleted: ${adm}`);

        // 9. File Requests
        const fr = await FileRequest.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ FileRequests deleted: ${fr}`);

        // 10. AR Reminder Logs
        const ar = await ARReminderLog.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ ARReminderLogs deleted: ${ar}`);

        // 11. Online Transactions
        const ot = await OnlineTransaction.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ OnlineTransactions deleted: ${ot}`);

        // 12. Visits (depend on Patient)
        const visits = await Visit.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ Visits deleted: ${visits}`);

        // 13. Patient-linked Notifications
        const notif = await Notification.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ Notifications deleted: ${notif}`);

        // 14. Finally delete Patients (this also clears scheme membership via schemeId FK on Patient)
        const patients = await Patient.destroy({ where: {}, truncate: false, transaction: t });
        console.log(`  ✅ Patients deleted: ${patients}`);

        await t.commit();
        console.log('\n✅ SUCCESS — All patient records wiped. Users, Schemes, Services, and Ledger data are intact.');
        process.exit(0);
    } catch (err) {
        await t.rollback();
        console.error('\n❌ FAILED — Transaction rolled back. No data was deleted.');
        console.error(err);
        process.exit(1);
    }
}

wipePatients();
