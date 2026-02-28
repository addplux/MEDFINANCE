/**
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

const { Payment, BankAccount, PettyCash, Patient, User, sequelize, OPDBill, PharmacyBill, LabBill, LabRequest, RadiologyBill, TheatreBill, MaternityBill, SpecialistClinicBill, PayrollDeduction } = require('../models');
const logAudit = require('../utils/auditLogger');
const { updatePatientBalance } = require('../utils/balanceUpdater');
const { postPayment } = require('../utils/glPoster');

// ========== Payments ==========

// Get all payments
const getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 20, paymentMethod } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (paymentMethod) where.paymentMethod = paymentMethod;

        const { count, rows } = await Payment.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['paymentDate', 'DESC']],
            include: [
                { association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] },
                { association: 'receiver', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Failed to get payments' });
    }
};

// Create payment
const createPayment = async (req, res) => {
    // Note: Payment creation might span multiple tables in a real scenario (updating bill status), 
    // but here it's a single insert. We can wrap in transaction if we expand logic.
    const t = await sequelize.transaction();

    try {
        const { patientId, amount, paymentMethod, referenceNumber, paymentDate, billType, billId, notes } = req.body;

        if (!patientId || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Patient, amount, and payment method are required' });
        }

        // Generate receipt number
        const paymentCount = await Payment.count();
        const receiptNumber = `RCP${String(paymentCount + 1).padStart(6, '0')}`;

        const payment = await Payment.create({
            receiptNumber,
            patientId,
            amount,
            paymentMethod,
            referenceNumber,
            paymentDate: paymentDate || new Date(),
            billType,
            billId,
            notes,
            receivedBy: req.user.id
        }, { transaction: t });

        // Audit Log
        await logAudit({
            userId: req.user.id,
            action: 'create',
            tableName: 'payments',
            recordId: payment.id,
            changes: { amount, paymentMethod, billType, billId },
            req,
            transaction: t
        });

        // Handle marking bills as paid
        let billsToProcess = req.body.paidBills; // array of { type: 'OPD', id: 1 }
        if (!billsToProcess && billType && billId) {
            billsToProcess = [{ type: billType, id: billId }];
        }

        if (billsToProcess && billsToProcess.length > 0) {
            for (const b of billsToProcess) {
                let model;
                switch (b.type) {
                    case 'OPD':
                    case 'OPDBill': model = OPDBill; break;
                    case 'Pharmacy':
                    case 'PharmacyBill': model = PharmacyBill; break;
                    case 'Laboratory':
                    case 'LabBill':
                    case 'LaboratoryBill': model = LabBill; break;
                    case 'LabRequest': model = LabRequest; break;
                    case 'Radiology':
                    case 'RadiologyBill': model = RadiologyBill; break;
                    case 'Theatre':
                    case 'TheatreBill': model = TheatreBill; break;
                    case 'Maternity':
                    case 'MaternityBill': model = MaternityBill; break;
                    case 'Specialist Clinic':
                    case 'Specialist':
                    case 'SpecialistClinicBill': model = SpecialistClinicBill; break;
                }
                if (model) {
                    await model.update({ paymentStatus: 'paid' }, { where: { id: b.id }, transaction: t });
                }
            }
        }

        // Handle Payroll Deduction Creation
        if (paymentMethod === 'payroll') {
            const patient = await Patient.findByPk(patientId, { transaction: t });
            if (patient && patient.staffId) {
                const now = new Date();
                const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                
                await PayrollDeduction.create({
                    staffId: patient.staffId,
                    amount: amount,
                    period: period,
                    description: `Medical Bill Deduction: ${receiptNumber}${billType ? ` (${billType})` : ''}`,
                    type: 'Medical Bill',
                    status: 'Pending',
                    referenceId: payment.id,
                    referenceType: 'Payment'
                }, { transaction: t });
            }
        }

        // Update Patient Balance
        await updatePatientBalance(patientId, t);


        // Post to General Ledger (non-blocking — GL errors must not roll back the payment)
        try {
            await postPayment(payment, t);
        } catch (glError) {
            console.error('⚠️ GL posting failed (non-fatal, payment will still save):', glError.message);
        }

        await t.commit();

        // Fetch the created payment with deep relations so the frontend can instantly print a receipt
        const createdPayment = await Payment.findByPk(payment.id, {
            include: [
                { association: 'patient' },
                { association: 'receiver', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        // Depending on billType, fetch the granular bill details
        let billDetails = null;
        if (createdPayment.billType && createdPayment.billId) {
            let model;
            let includeOptions = [];
            switch (createdPayment.billType) {
                case 'OPD':
                case 'OPDBill':
                    model = OPDBill;
                    includeOptions = [{ association: 'service' }];
                    break;
                case 'Pharmacy':
                case 'PharmacyBill': model = PharmacyBill; break;
                case 'Laboratory':
                case 'LabBill':
                case 'LaboratoryBill': model = LabBill; break;
                case 'Radiology':
                case 'RadiologyBill': model = RadiologyBill; break;
                case 'Theatre':
                case 'TheatreBill': model = TheatreBill; break;
                case 'Maternity':
                case 'MaternityBill': model = MaternityBill; break;
                case 'Specialist Clinic':
                case 'Specialist':
                case 'SpecialistClinicBill': model = SpecialistClinicBill; break;
            }
            if (model) {
                billDetails = await model.findByPk(createdPayment.billId, { include: includeOptions });
            }
        }

        res.status(201).json({ payment: createdPayment, billDetails });
    } catch (error) {
        await t.rollback();
        console.error('Create payment error:', error);
        res.status(500).json({
            error: 'Failed to create payment',
            detail: error.message,
            fields: error.errors?.map(e => ({ field: e.path, message: e.message }))
        });
    }
};

// Get single payment receipt
const getPaymentReceipt = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await Payment.findByPk(id, {
            include: [
                { association: 'patient' },
                { association: 'receiver', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        if (!payment) {
            return res.status(404).json({ error: 'Receipt not found' });
        }

        // Fetch Bill Details
        let billDetails = null;
        if (payment.billType && payment.billId) {
            let model;
            let includeOptions = [];
            switch (payment.billType) {
                case 'OPD':
                case 'OPDBill':
                    model = OPDBill;
                    includeOptions = [{ association: 'service' }];
                    break;
                case 'Pharmacy':
                case 'PharmacyBill': model = PharmacyBill; break;
                case 'Laboratory':
                case 'LabBill':
                case 'LaboratoryBill': model = LabBill; break;
                case 'Radiology':
                case 'RadiologyBill': model = RadiologyBill; break;
                case 'Theatre':
                case 'TheatreBill': model = TheatreBill; break;
                case 'Maternity':
                case 'MaternityBill': model = MaternityBill; break;
                case 'Specialist Clinic':
                case 'Specialist':
                case 'SpecialistClinicBill': model = SpecialistClinicBill; break;
            }
            if (model) {
                billDetails = await model.findByPk(payment.billId, { include: includeOptions });
            }
        }

        res.json({ payment, billDetails });
    } catch (error) {
        console.error('Get payment receipt error:', error);
        res.status(500).json({ error: 'Failed to fetch receipt details' });
    }
};

// ========== Bank Accounts ==========

// Get all bank accounts
const getAllBankAccounts = async (req, res) => {
    try {
        const { status } = req.query;

        const where = {};
        if (status) where.status = status;

        const accounts = await BankAccount.findAll({
            where,
            order: [['bankName', 'ASC']]
        });

        res.json(accounts);
    } catch (error) {
        console.error('Get bank accounts error:', error);
        res.status(500).json({ error: 'Failed to get bank accounts' });
    }
};

// Create bank account
const createBankAccount = async (req, res) => {
    try {
        const { bankName, accountName, accountType, currency, branchName } = req.body;

        if (!bankName || !accountName || !accountType) {
            return res.status(400).json({ error: 'Bank name, account name, and account type are required' });
        }

        // Generate account number
        const accountCount = await BankAccount.count();
        const accountNumber = `BA${String(accountCount + 1).padStart(6, '0')}`;

        const account = await BankAccount.create({
            accountNumber,
            bankName,
            accountName,
            accountType,
            currency: currency || 'ZMW',
            branchName
        });

        res.status(201).json(account);
    } catch (error) {
        console.error('Create bank account error:', error);
        res.status(500).json({ error: 'Failed to create bank account' });
    }
};

// ========== Petty Cash ==========

// Get all petty cash transactions
const getAllPettyCash = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const { count, rows } = await PettyCash.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['transactionDate', 'DESC']],
            include: [
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
                { association: 'approver', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Get petty cash error:', error);
        res.status(500).json({ error: 'Failed to get petty cash transactions' });
    }
};

// Create petty cash transaction
const createPettyCash = async (req, res) => {
    try {
        const { transactionDate, description, category, amount, transactionType, payee, notes } = req.body;

        if (!description || !amount || !transactionType) {
            return res.status(400).json({ error: 'Description, amount, and transaction type are required' });
        }

        // Generate voucher number
        const voucherCount = await PettyCash.count();
        const voucherNumber = `PC${String(voucherCount + 1).padStart(6, '0')}`;

        const transaction = await PettyCash.create({
            voucherNumber,
            transactionDate: transactionDate || new Date(),
            description,
            category,
            amount,
            transactionType,
            payee,
            notes,
            createdBy: req.user.id
        });

        const createdTransaction = await PettyCash.findByPk(transaction.id, {
            include: [
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json(createdTransaction);
    } catch (error) {
        console.error('Create petty cash error:', error);
        res.status(500).json({ error: 'Failed to create petty cash transaction' });
    }
};

// Approve petty cash transaction
const approvePettyCash = async (req, res) => {
    try {
        const transaction = await PettyCash.findByPk(req.params.id);

        if (!transaction) {
            return res.status(404).json({ error: 'Petty cash transaction not found' });
        }

        if (transaction.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending transactions can be approved' });
        }

        await transaction.update({
            status: 'approved',
            approvedBy: req.user.id
        });

        // Audit Log
        await logAudit({
            userId: req.user.id,
            action: 'update',
            tableName: 'petty_cash',
            recordId: transaction.id,
            changes: { status: 'approved' },
            req
        });

        const approvedTransaction = await PettyCash.findByPk(transaction.id, {
            include: [
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
                { association: 'approver', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json(approvedTransaction);
    } catch (error) {
        console.error('Approve petty cash error:', error);
        res.status(500).json({ error: 'Failed to approve petty cash transaction' });
    }
};

module.exports = {
    getAllPayments,
    createPayment,
    getPaymentReceipt,
    getAllBankAccounts,
    createBankAccount,
    getAllPettyCash,
    createPettyCash,
    approvePettyCash
};
