const { PayrollDeduction, User, JournalEntry, JournalLine, ChartOfAccounts, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get all deductions
const getDeductions = async (req, res) => {
    try {
        const { period, status } = req.query;
        const where = {};

        if (period) {
            where.period = period;
        }

        if (status) {
            where.status = status;
        }

        const deductions = await PayrollDeduction.findAll({
            where,
            include: [{
                model: User,
                as: 'staff',
                attributes: ['id', 'firstName', 'lastName', 'email', 'role']
            }],
            order: [['period', 'DESC'], ['createdAt', 'DESC']]
        });

        res.json(deductions);
    } catch (error) {
        console.error('Error fetching deductions:', error);
        res.status(500).json({ error: 'Failed to fetch deductions' });
    }
};

// Create a new deduction
const createDeduction = async (req, res) => {
    try {
        const { staffId, amount, period, description, type } = req.body;

        const deduction = await PayrollDeduction.create({
            staffId,
            amount,
            period,
            description,
            type,
            status: 'Pending'
        });

        res.status(201).json(deduction);
    } catch (error) {
        console.error('Error creating deduction:', error);
        res.status(500).json({ error: 'Failed to create deduction' });
    }
};

// Get aggregated staff balances (Total Pending Debt)
const getStaffBalances = async (req, res) => {
    try {
        // Find all staff who have pending deductions
        const balances = await PayrollDeduction.findAll({
            where: { status: 'Pending' },
            attributes: [
                'staffId',
                [PayrollDeduction.sequelize.fn('SUM', PayrollDeduction.sequelize.col('amount')), 'totalDebt'],
                [PayrollDeduction.sequelize.fn('COUNT', PayrollDeduction.sequelize.col('id')), 'pendingCount']
            ],
            include: [{
                model: User,
                as: 'staff',
                attributes: ['firstName', 'lastName', 'email', 'role']
            }],
            group: ['staffId', 'staff.id', 'staff.first_name', 'staff.last_name', 'staff.email', 'staff.role']
        });

        res.json(balances);
    } catch (error) {
        console.error('Error fetching staff balances:', error);
        res.status(500).json({ error: 'Failed to fetch staff balances' });
    }
};

// Update status (e.g., Mark as Deducted)
const updateDeductionStatus = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { status } = req.body;

        const deduction = await PayrollDeduction.findByPk(id, { transaction: t });
        if (!deduction) {
            await t.rollback();
            return res.status(404).json({ error: 'Deduction not found' });
        }

        const oldStatus = deduction.status;
        deduction.status = status;
        
        if (status === 'Deducted' && oldStatus !== 'Deducted') {
            deduction.deductionDate = new Date();

            // Create Journal Entry
            const entryCount = await JournalEntry.count({ transaction: t });
            const entryNumber = `PJE${String(entryCount + 1).padStart(6, '0')}`;
            
            const journalEntry = await JournalEntry.create({
                entryNumber,
                entryDate: new Date(),
                description: `Payroll Deduction: ${deduction.description}`,
                status: 'posted',
                postedBy: req.user.id,
                createdBy: req.user.id
            }, { transaction: t });

            // Find Salary Payable Account (Search by common keywords)
            let salaryPayable = await ChartOfAccounts.findOne({ 
                where: { accountName: { [Op.like]: '%Salary%Payable%' } },
                transaction: t
            });

            // If not found, use a generic liability account or fallback
            const salaryPayableId = salaryPayable ? salaryPayable.id : null;
            
            // Note: deduction.accountId should ideally be the Staff Medical Receivable (Asset) 
            // set during cashier processing. If not set, we'll need a fallback.
            let medicalReceivableId = deduction.accountId;
            if (!medicalReceivableId) {
                const medicalRec = await ChartOfAccounts.findOne({
                    where: { accountName: { [Op.like]: '%Staff%Medical%Receivable%' } },
                    transaction: t
                });
                medicalReceivableId = medicalRec ? medicalRec.id : null;
            }

            if (salaryPayableId && medicalReceivableId) {
                // DEBIT Salary Payable (Decrease Liability)
                await JournalLine.create({
                    entryId: journalEntry.id,
                    accountId: salaryPayableId,
                    debit: deduction.amount,
                    credit: 0,
                    description: `Payroll Deduction: ${deduction.staffName || 'Staff Member'}`
                }, { transaction: t });

                // CREDIT Staff Medical Receivable (Decrease Asset)
                await JournalLine.create({
                    entryId: journalEntry.id,
                    accountId: medicalReceivableId,
                    debit: 0,
                    credit: deduction.amount,
                    description: `Payroll Deduction: ${deduction.staffName || 'Staff Member'}`
                }, { transaction: t });
            }
        }
        
        await deduction.save({ transaction: t });
        await t.commit();

        res.json(deduction);
    } catch (error) {
        await t.rollback();
        console.error('Error updating deduction status:', error);
        res.status(500).json({ error: 'Failed to update deduction status', detail: error.message });
    }
};

// Batch Update status
const batchUpdateDeductions = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids)) {
            await t.rollback();
            return res.status(400).json({ error: 'IDs array is required' });
        }

        const results = [];
        for (const id of ids) {
            const deduction = await PayrollDeduction.findByPk(id, { transaction: t });
            if (!deduction) continue;

            const oldStatus = deduction.status;
            deduction.status = status;

            if (status === 'Deducted' && oldStatus !== 'Deducted') {
                deduction.deductionDate = new Date();

                // Create Journal Entry
                const entryCount = await JournalEntry.count({ transaction: t });
                const entryNumber = `BPE${String(entryCount + 1).padStart(6, '0')}`;

                const journalEntry = await JournalEntry.create({
                    entryNumber,
                    entryDate: new Date(),
                    description: `Batch Payroll Deduction: ${deduction.description}`,
                    status: 'posted',
                    postedBy: req.user.id,
                    createdBy: req.user.id
                }, { transaction: t });

                // Find Salary Payable Account
                let salaryPayable = await ChartOfAccounts.findOne({
                    where: { accountName: { [Op.like]: '%Salary%Payable%' } },
                    transaction: t
                });

                const salaryPayableId = salaryPayable ? salaryPayable.id : null;
                let medicalReceivableId = deduction.accountId;

                if (!medicalReceivableId) {
                    const medicalRec = await ChartOfAccounts.findOne({
                        where: { accountName: { [Op.like]: '%Staff%Medical%Receivable%' } },
                        transaction: t
                    });
                    medicalReceivableId = medicalRec ? medicalRec.id : null;
                }

                if (salaryPayableId && medicalReceivableId) {
                    await JournalLine.create({
                        entryId: journalEntry.id,
                        accountId: salaryPayableId,
                        debit: deduction.amount,
                        credit: 0,
                        description: `Payroll Deduction: ${deduction.staffName || 'Staff Member'}`
                    }, { transaction: t });

                    await JournalLine.create({
                        entryId: journalEntry.id,
                        accountId: medicalReceivableId,
                        debit: 0,
                        credit: deduction.amount,
                        description: `Payroll Deduction: ${deduction.staffName || 'Staff Member'}`
                    }, { transaction: t });
                }
            }

            await deduction.save({ transaction: t });
            results.push(deduction);
        }

        await t.commit();
        res.json({ message: `Successfully updated ${results.length} deductions`, data: results });
    } catch (error) {
        await t.rollback();
        console.error('Batch update failed:', error);
        res.status(500).json({ error: 'Batch update failed', detail: error.message });
    }
};

module.exports = {
    getDeductions,
    createDeduction,
    getStaffBalances,
    updateDeductionStatus,
    batchUpdateDeductions
};
