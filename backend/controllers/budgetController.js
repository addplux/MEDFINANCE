const { Budget, Department, User, sequelize } = require('../models');

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
            order: [['fiscalYear', 'DESC'], ['departmentId', 'ASC']],
            include: [
                { association: 'department', attributes: ['id', 'departmentCode', 'departmentName'] },
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
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
                { association: 'approver', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        res.json(budget);
    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({ error: 'Failed to get budget' });
    }
};

// Create budget
const createBudget = async (req, res) => {
    try {
        const { departmentId, fiscalYear, budgetAmount, notes } = req.body;

        if (!departmentId || !fiscalYear || !budgetAmount) {
            return res.status(400).json({ error: 'Department, fiscal year, and budget amount are required' });
        }

        // Check if budget already exists for this department and fiscal year
        const existingBudget = await Budget.findOne({
            where: { departmentId, fiscalYear }
        });

        if (existingBudget) {
            return res.status(400).json({ error: 'Budget already exists for this department and fiscal year' });
        }

        const budget = await Budget.create({
            departmentId,
            fiscalYear,
            budgetAmount,
            notes,
            createdBy: req.user.id
        });

        const createdBudget = await Budget.findByPk(budget.id, {
            include: [
                { association: 'department' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json(createdBudget);
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Failed to create budget' });
    }
};

// Update budget
const updateBudget = async (req, res) => {
    try {
        const budget = await Budget.findByPk(req.params.id);

        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        if (budget.status === 'approved') {
            return res.status(400).json({ error: 'Cannot update approved budget' });
        }

        await budget.update(req.body);

        const updatedBudget = await Budget.findByPk(budget.id, {
            include: [
                { association: 'department' },
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

        if (budget.status !== 'draft') {
            return res.status(400).json({ error: 'Only draft budgets can be approved' });
        }

        await budget.update({
            status: 'approved',
            approvedBy: req.user.id
        });

        const approvedBudget = await Budget.findByPk(budget.id, {
            include: [
                { association: 'department' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
                { association: 'approver', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json(approvedBudget);
    } catch (error) {
        console.error('Approve budget error:', error);
        res.status(500).json({ error: 'Failed to approve budget' });
    }
};

// Get variance analysis
const getVarianceAnalysis = async (req, res) => {
    try {
        const { fiscalYear } = req.query;

        if (!fiscalYear) {
            return res.status(400).json({ error: 'Fiscal year is required' });
        }

        const budgets = await Budget.findAll({
            where: { fiscalYear, status: 'approved' },
            include: [{ association: 'department' }]
        });

        const analysis = budgets.map(budget => {
            const budgetAmt = parseFloat(budget.budgetAmount);
            const actualAmt = parseFloat(budget.actualSpent);
            const variance = budgetAmt - actualAmt;
            const variancePercent = budgetAmt > 0 ? (variance / budgetAmt) * 100 : 0;

            return {
                departmentId: budget.departmentId,
                departmentCode: budget.department.departmentCode,
                departmentName: budget.department.departmentName,
                fiscalYear: budget.fiscalYear,
                budgetAmount: budgetAmt,
                actualSpent: actualAmt,
                variance,
                variancePercent: variancePercent.toFixed(2),
                status: variance >= 0 ? 'under_budget' : 'over_budget'
            };
        });

        const totalBudget = analysis.reduce((sum, item) => sum + item.budgetAmount, 0);
        const totalActual = analysis.reduce((sum, item) => sum + item.actualSpent, 0);
        const totalVariance = totalBudget - totalActual;

        res.json({
            fiscalYear,
            departments: analysis,
            summary: {
                totalBudget,
                totalActual,
                totalVariance,
                totalVariancePercent: totalBudget > 0 ? ((totalVariance / totalBudget) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Get variance analysis error:', error);
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
