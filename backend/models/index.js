const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Role = require('./Role');
const Patient = require('./Patient');
const Service = require('./Service');
const OPDBill = require('./OPDBill');
const IPDBill = require('./IPDBill');
const PharmacyBill = require('./PharmacyBill');
const LabBill = require('./LabBill');
const RadiologyBill = require('./RadiologyBill');
const NHIMAClaim = require('./NHIMAClaim');
const ClaimBatch = require('./ClaimBatch');
const CorporateAccount = require('./CorporateAccount');
const Scheme = require('./Scheme');
const SchemeInvoice = require('./SchemeInvoice');
const Supplier = require('./Supplier');
const Invoice = require('./Invoice');
const PaymentVoucher = require('./PaymentVoucher');
const ChartOfAccounts = require('./ChartOfAccounts');
const JournalEntry = require('./JournalEntry');
const JournalLine = require('./JournalLine');
const Payment = require('./Payment');
const BankAccount = require('./BankAccount');
const PettyCash = require('./PettyCash');
const Department = require('./Department');
const Budget = require('./Budget');
const Asset = require('./Asset');
const AuditLog = require('./AuditLog');
const Organization = require('./Organization');
const PayrollDeduction = require('./PayrollDeduction');
const Fund = require('./Fund');
const FundTransaction = require('./FundTransaction');
const Medication = require('./Medication');
const PharmacyBatch = require('./PharmacyBatch');
const LabTest = require('./LabTest');
const LabRequest = require('./LabRequest');
const PatientMovement = require('./PatientMovement');
const LabResult = require('./LabResult');
const TheatreBill = require('./TheatreBill');
const MaternityBill = require('./MaternityBill');
const SpecialistClinicBill = require('./SpecialistClinicBill');
const Shift = require('./Shift');
const Refund = require('./Refund');
const Notification = require('./Notification');
const Visit = require('./Visit');

// Define relationships

// ... (existing relationships)



// Refund relationships
Refund.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });
Refund.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });
Refund.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });


// ... (rest of file)



// User relationships
User.hasMany(OPDBill, { foreignKey: 'createdBy', as: 'opdBills' });
User.hasMany(IPDBill, { foreignKey: 'createdBy', as: 'ipdBills' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
User.hasMany(Department, { foreignKey: 'managerId', as: 'managedDepartments' });
User.hasMany(Shift, { foreignKey: 'userId', as: 'shifts' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });

// ... (other relationships)

// Shift relationships
Shift.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ... (rest of file)



// Patient relationships
Patient.hasMany(OPDBill, { foreignKey: 'patientId', as: 'opdBills' });
Patient.hasMany(IPDBill, { foreignKey: 'patientId', as: 'ipdBills' });
Patient.hasMany(PharmacyBill, { foreignKey: 'patientId', as: 'pharmacyBills' });
Patient.hasMany(LabBill, { foreignKey: 'patientId', as: 'labBills' });
Patient.hasMany(RadiologyBill, { foreignKey: 'patientId', as: 'radiologyBills' });
Patient.hasMany(TheatreBill, { foreignKey: 'patientId', as: 'theatreBills' });
Patient.hasMany(MaternityBill, { foreignKey: 'patientId', as: 'maternityBills' });
Patient.hasMany(SpecialistClinicBill, { foreignKey: 'patientId', as: 'specialistClinicBills' });
Patient.hasMany(NHIMAClaim, { foreignKey: 'patientId', as: 'nhimaClaims' });
Patient.hasMany(Payment, { foreignKey: 'patientId', as: 'payments' });

// Service relationships
Service.hasMany(OPDBill, { foreignKey: 'serviceId', as: 'opdBills' });

// Scheme relationships
Scheme.hasMany(Patient, { foreignKey: 'schemeId', as: 'patients' });
Patient.belongsTo(Scheme, { foreignKey: 'schemeId', as: 'scheme' });

// Billing relationships
OPDBill.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
OPDBill.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
OPDBill.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

IPDBill.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
IPDBill.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

PharmacyBill.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
PharmacyBill.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

LabBill.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
LabBill.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

RadiologyBill.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
RadiologyBill.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

TheatreBill.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

MaternityBill.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

SpecialistClinicBill.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

// NHIMA Claims

NHIMAClaim.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
NHIMAClaim.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
NHIMAClaim.belongsTo(ClaimBatch, { foreignKey: 'batchId', as: 'batch' });
ClaimBatch.hasMany(NHIMAClaim, { foreignKey: 'batchId', as: 'claims' });
ClaimBatch.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Supplier and Invoice relationships
Supplier.hasMany(Invoice, { foreignKey: 'supplierId', as: 'invoices' });
Invoice.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Invoice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Invoice.hasMany(PaymentVoucher, { foreignKey: 'invoiceId', as: 'paymentVouchers' });

PaymentVoucher.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
PaymentVoucher.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
PaymentVoucher.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Chart of Accounts - Self-referencing for hierarchy
ChartOfAccounts.hasMany(ChartOfAccounts, { foreignKey: 'parentId', as: 'children' });
ChartOfAccounts.belongsTo(ChartOfAccounts, { foreignKey: 'parentId', as: 'parent' });

// Journal Entry relationships
JournalEntry.hasMany(JournalLine, { foreignKey: 'entryId', as: 'lines' });
JournalEntry.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
JournalEntry.belongsTo(User, { foreignKey: 'postedBy', as: 'poster' });

JournalLine.belongsTo(JournalEntry, { foreignKey: 'entryId', as: 'entry' });
JournalLine.belongsTo(ChartOfAccounts, { foreignKey: 'accountId', as: 'account' });

// Payment relationships
Payment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Payment.belongsTo(User, { foreignKey: 'receivedBy', as: 'receiver' });

// Scheme Invoice relationships
SchemeInvoice.belongsTo(Scheme, { foreignKey: 'schemeId', as: 'scheme' });
SchemeInvoice.belongsTo(User, { foreignKey: 'generatedBy', as: 'generator' });
Scheme.hasMany(SchemeInvoice, { foreignKey: 'schemeId', as: 'invoices' });

// Bill associations with Scheme Invoice
OPDBill.belongsTo(SchemeInvoice, { foreignKey: 'schemeInvoiceId', as: 'schemeInvoice' });
PharmacyBill.belongsTo(SchemeInvoice, { foreignKey: 'schemeInvoiceId', as: 'schemeInvoice' });
LabBill.belongsTo(SchemeInvoice, { foreignKey: 'schemeInvoiceId', as: 'schemeInvoice' });
RadiologyBill.belongsTo(SchemeInvoice, { foreignKey: 'schemeInvoiceId', as: 'schemeInvoice' });

SchemeInvoice.hasMany(OPDBill, { foreignKey: 'schemeInvoiceId', as: 'opdBills' });
SchemeInvoice.hasMany(PharmacyBill, { foreignKey: 'schemeInvoiceId', as: 'pharmacyBills' });
SchemeInvoice.hasMany(LabBill, { foreignKey: 'schemeInvoiceId', as: 'labBills' });
SchemeInvoice.hasMany(RadiologyBill, { foreignKey: 'schemeInvoiceId', as: 'radiologyBills' });

// Petty Cash relationships
PettyCash.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
PettyCash.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Department and Budget relationships
Department.hasMany(Budget, { foreignKey: 'departmentId', as: 'budgets' });
Department.hasMany(Asset, { foreignKey: 'departmentId', as: 'assets' });
Department.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

Budget.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// Asset relationships
Asset.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Asset.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Audit Log relationships
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Fund relationships
Fund.hasMany(FundTransaction, { foreignKey: 'fundId', as: 'transactions' });
FundTransaction.belongsTo(Fund, { foreignKey: 'fundId', as: 'fund' });
FundTransaction.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Pharmacy relationships
Medication.hasMany(PharmacyBatch, { foreignKey: 'medicationId', as: 'batches' });
PharmacyBatch.belongsTo(Medication, { foreignKey: 'medicationId', as: 'medication' });

PharmacyBill.belongsTo(Medication, { foreignKey: 'medicationId', as: 'medicationDetails' });
PharmacyBill.belongsTo(PharmacyBatch, { foreignKey: 'batchId', as: 'batch' });

// Lab relationships
LabRequest.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
LabRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'doctor' });
LabRequest.hasMany(LabResult, { foreignKey: 'labRequestId', as: 'results' });

LabResult.belongsTo(LabRequest, { foreignKey: 'labRequestId', as: 'request' });
LabResult.belongsTo(LabTest, { foreignKey: 'testId', as: 'test' });
LabResult.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });
LabResult.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });

// Patient Movement relationships
Patient.hasMany(PatientMovement, { foreignKey: 'patientId', as: 'movements' });
PatientMovement.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
PatientMovement.belongsTo(User, { foreignKey: 'admittedBy', as: 'admitter' });

// Visit relationships
Visit.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Visit.belongsTo(User, { foreignKey: 'admittedById', as: 'admitter' });
Visit.belongsTo(Scheme, { foreignKey: 'schemeId', as: 'scheme' });
Visit.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Patient.hasMany(Visit, { foreignKey: 'patientId', as: 'visits' });
Scheme.hasMany(Visit, { foreignKey: 'schemeId', as: 'visits' });
Department.hasMany(Visit, { foreignKey: 'departmentId', as: 'visits' });

// Payroll Deduction relationships
PayrollDeduction.belongsTo(User, { foreignKey: 'staffId', as: 'staff' });

// Sync database
const syncDatabase = async (options = {}) => {
    try {
        await sequelize.sync(options);
        console.log('✅ Database synchronized successfully');
    } catch (error) {
        console.error('❌ Error synchronizing database:', error);
        throw error;
    }
};

module.exports = {
    sequelize,
    syncDatabase,
    // Export all models
    User,
    Patient,
    Service,
    OPDBill,
    IPDBill,
    PharmacyBill,
    LabBill,
    RadiologyBill,
    NHIMAClaim,
    ClaimBatch,
    CorporateAccount,
    Scheme,
    SchemeInvoice,
    Supplier,
    Invoice,
    PaymentVoucher,
    ChartOfAccounts,
    JournalEntry,
    JournalLine,
    Payment,
    BankAccount,
    PettyCash,
    Department,
    Budget,
    Asset,
    AuditLog,
    Organization,
    PayrollDeduction,
    Fund,
    FundTransaction,
    Medication,
    PharmacyBatch,
    LabTest,
    LabRequest,
    LabResult,
    PatientMovement,
    TheatreBill,
    MaternityBill,
    SpecialistClinicBill,
    Shift,
    Refund,
    Role,
    Notification,
    Visit
};



