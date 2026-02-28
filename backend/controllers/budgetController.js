const { Budget, Department, User, ChartOfAccounts, JournalLine, JournalEntry, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper to calculate actual spent from Journal Entries
const calculateActualAmount = async (accountId, fiscalYear) => {
    if (!accountId) return 0;
    
    // Define date range for fiscal year (assuming Jan 1st to Dec 31st)
    const startDate = new Date(`${fiscalYear}-01-01`);
    const endDate = new Date(`${fiscalYear}-12-31T23:59:59`);

    const result = await JournalLine.findAll({
        attributes: [
            [sequelize.fn('SUM', sequelize.literal('debit - credit')), 'netTotal']
        ],
        include: [{
            model: JournalEntry,
            as: 'entry',
            where: {
                status: 'posted',
                createdAt: { [Op.between]: [startDate, endDate] }
            },
            attributes: []
        }],
        where: { accountId },
        raw: true
    });

    // For expense accounts, debit-credit is positive. 
    // For revenue, we might need credit-debit, but usually budget is for expenses.
    // If we want to be precise, we'd check account type.
    const netTotal = parseFloat(result[0]?.netTotal || 0);
    return Math.abs(netTotal); // Simplify for now
};

// Get all budgets
const getAllBudgets = async (req, res) => {
    try {
        const { page = 1, limit = 20, fiscalYear, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (fiscalYear) where.fiscalYear = fiscalYear;
        if (status) where.status = status;

        const { count, rows } = await Budget.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['fiscal_year', 'DESC'], ['department_id', 'ASC']],
            include: [
                { association: 'department', attributes: ['id', 'departmentCode', 'departmentName'] },
                { association: 'account', attributes: ['id', 'accountCode', 'accountName', 'accountType'] },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
                { association: 'approver', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        // Update actual amounts on the fly for better visibility
        const data = await Promise.all(rows.map(async (b) => {
            const actual = await calculateActualAmount(b.accountId, b.fiscalYear);
            const budgetVal = parseFloat(b.budgetedAmount);
            const variance = budgetVal - actual;
            const variancePercent = budgetVal > 0 ? (variance / budgetVal) * 100 : 0;
            
            return {
                ...b.toJSON(),
                actualAmount: actual,
                variance,
                variancePercentage: variancePercent.toFixed(2)
            };
        }));

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data
        });
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Failed to get budgets' });
    }
};

// Get single budget
const getBudget = async (req, res) => {
    try {
        const budget = await Budget.findByPk(req.params.id, {
            include: [
                { association: 'department' },
                { association: 'account' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
                { association: 'approver', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        const actual = await calculateActualAmount(budget.accountId, budget.fiscalYear);
        
        res.json({
            ...budget.toJSON(),
            actualAmount: actual
        });
    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({ error: 'Failed to get budget' });
    }
};

// Create budget
const createBudget = async (req, res) => {
    try {
        const { departmentId, accountId, fiscalYear, budgetAmount, category, notes } = req.body;

        if (!departmentId || !fiscalYear || !budgetAmount) {
            return res.status(400).json({ error: 'Department, fiscal year, and budget amount are required' });
        }

        // Check if budget already exists for this department, fiscal year and account
        const exWhere = { departmentId, fiscalYear };
        if (accountId) exWhere.accountId = accountId;
        else exWhere.category = category || 'Operational';

        const existingBudget = await Budget.findOne({ where: exWhere });

        if (existingBudget) {
            return res.status(400).json({ error: 'Budget already exists for this combination' });
        }

        const budget = await Budget.create({
            departmentId,
            accountId,
            fiscalYear,
            budgetedAmount: budgetAmount,
            category: category || 'Operational',
            notes,
            createdBy: req.user.id,
            status: 'draft'
        });

        const createdBudget = await Budget.findByPk(budget.id, {
            include: [
                { association: 'department' },
                { association: 'account' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json(createdBudget);
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Failed to create budget', details: error.message });
    }
};

// Update budget
const updateBudget = async (req, res) => {
    try {
        const budget = await Budget.findByPk(req.params.id);

        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        if (budget.status === 'approved' && req.user.role !== 'admin') {
            return res.status(400).json({ error: 'Only admins can update approved budgets' });
        }

        // Map budgetAmount to budgetedAmount if provided
        const updateData = { ...req.body };
        if (updateData.budgetAmount !== undefined) {
            updateData.budgetedAmount = updateData.budgetAmount;
        }

        await budget.update(updateData);

        const updatedBudget = await Budget.findByPk(budget.id, {
            include: [
                { association: 'department' },
                { association: 'account' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json(updatedBudget);
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({ error: 'Failed to update budget' });
    }
};

// Approve budget
const approveBudget = async (req, res) => {
    try {
        const budget = await Budget.findByPk(req.params.id);

        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        await budget.update({
            status: 'approved',
            approvedBy: req.user.id
        });

        res.json({ message: 'Budget approved successfully' });
    } catch (error) {
        console.error('Approve budget error:', error);
        res.status(500).json({ error: 'Failed to approve budget' });
    }
};

// Get variance analysis
const getVarianceAnalysis = async (req, res) => {
    try {
        const { fiscalYear } = req.query;
        const fYear = fiscalYear || new Date().getFullYear();

        const budgets = await Budget.findAll({
            where: { fiscalYear: fYear, status: 'approved' },
            include: [{ association: 'department' }, { association: 'account' }]
        });

        const analysis = await Promise.all(budgets.map(async budget => {
            const budgetAmt = parseFloat(budget.budgetedAmount);
            const actualAmt = await calculateActualAmount(budget.accountId, budget.fiscalYear);
            const variance = budgetAmt - actualAmt;
            const variancePercent = budgetAmt > 0 ? (variance / budgetAmt) * 100 : 0;

            return {
                id: budget.id,
                departmentName: budget.department.departmentName,
                accountName: budget.account?.accountName || 'N/A',
                fiscalYear: budget.fiscalYear,
                budgetedAmount: budgetAmt,
                actualAmount: actualAmt,
                variance,
                variancePercent: variancePercent.toFixed(2),
                status: variance >= 0 ? 'under_budget' : 'over_budget'
            };
        }));

        res.json({
            fiscalYear: fYear,
            data: analysis,
            summary: {
                totalBudget: analysis.reduce((sum, item) => sum + item.budgetedAmount, 0),
                totalActual: analysis.reduce((sum, item) => sum + item.actualAmount, 0),
                totalVariance: analysis.reduce((sum, item) => sum + item.variance, 0)
            }
        });
    } catch (error) {
        console.error('Variance analysis error:', error);
        res.status(500).json({ error: 'Failed to get variance analysis' });
    }
};

module.exports = {
    getAllBudgets,
    getBudget,
    createBudget,
    updateBudget,
    approveBudget,
    getVarianceAnalysis
};
