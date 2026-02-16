const { PayrollDeduction, User } = require('../models');
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
    try {
        const { id } = req.params;
        const { status } = req.body;

        const deduction = await PayrollDeduction.findByPk(id);
        if (!deduction) {
            return res.status(404).json({ error: 'Deduction not found' });
        }

        deduction.status = status;
        if (status === 'Deducted') {
            deduction.deductionDate = new Date();
        }
        await deduction.save();

        res.json(deduction);
    } catch (error) {
        console.error('Error updating deduction status:', error);
        res.status(500).json({ error: 'Failed to update deduction status' });
    }
};

module.exports = {
    getDeductions,
    createDeduction,
    getStaffBalances,
    updateDeductionStatus
};
