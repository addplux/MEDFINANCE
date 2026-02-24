const { Fund, FundTransaction, User, sequelize } = require('../models');

// Get all funds
const getAllFunds = async (req, res) => {
    try {
        const { status } = req.query;

        const where = {};
        if (status) where.status = status;

        const funds = await Fund.findAll({
            where,
            order: [['fundName', 'ASC']],
            include: [{
                model: FundTransaction,
                as: 'transactions',
                limit: 5,
                order: [['transactionDate', 'DESC']],
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName']
                }]
            }]
        });

        res.json(funds);
    } catch (error) {
        console.error('Get funds error:', error);
        res.status(500).json({ error: 'Failed to get funds' });
    }
};

// Get fund by ID
const getFundById = async (req, res) => {
    try {
        const fund = await Fund.findByPk(req.params.id, {
            include: [{
                model: FundTransaction,
                as: 'transactions',
                order: [['transactionDate', 'DESC']],
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName']
                }]
            }]
        });

        if (!fund) {
            return res.status(404).json({ error: 'Fund not found' });
        }

        res.json(fund);
    } catch (error) {
        console.error('Get fund error:', error);
        res.status(500).json({ error: 'Failed to get fund' });
    }
};

// Create fund
const createFund = async (req, res) => {
    try {
        const { fundName, fundType, description } = req.body;

        if (!fundName || !fundType) {
            return res.status(400).json({ error: 'Fund name and type are required' });
        }

        // Generate fund code
        const fundCount = await Fund.count({ where: { fundType } });
        const typePrefix = {
            'donor': 'DNR',
            'retention': 'RET',
            'general': 'GEN'
        };
        const fundCode = `${typePrefix[fundType]}${String(fundCount + 1).padStart(4, '0')}`;

        const fund = await Fund.create({
            fundCode,
            fundName,
            fundType,
            description,
            balance: 0
        });

        res.status(201).json(fund);
    } catch (error) {
        console.error('Create fund error:', error);
        res.status(500).json({ error: 'Failed to create fund' });
    }
};

// Update fund
const updateFund = async (req, res) => {
    try {
        const fund = await Fund.findByPk(req.params.id);

        if (!fund) {
            return res.status(404).json({ error: 'Fund not found' });
        }

        // Don't allow updating balance directly
        const { balance, ...updateData } = req.body;

        await fund.update(updateData);

        res.json(fund);
    } catch (error) {
        console.error('Update fund error:', error);
        res.status(500).json({ error: 'Failed to update fund' });
    }
};

// Get fund transactions
const getFundTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await FundTransaction.findAndCountAll({
            where: { fundId: req.params.id },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['transactionDate', 'DESC']],
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'firstName', 'lastName']
            }]
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Get fund transactions error:', error);
        res.status(500).json({ error: 'Failed to get fund transactions' });
    }
};

// Create fund transaction
const createFundTransaction = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { transactionType, amount, description, referenceNumber, transactionDate } = req.body;

        if (!transactionType || !amount) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Transaction type and amount are required' });
        }

        const fund = await Fund.findByPk(req.params.id, { transaction });

        if (!fund) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Fund not found' });
        }

        // Create transaction
        const fundTransaction = await FundTransaction.create({
            fundId: fund.id,
            transactionType,
            amount: parseFloat(amount),
            description,
            referenceNumber,
            transactionDate: transactionDate || new Date(),
            createdBy: req.user.id
        }, { transaction });

        // Update fund balance
        let newBalance = parseFloat(fund.balance);
        if (transactionType === 'deposit') {
            newBalance += parseFloat(amount);
        } else if (transactionType === 'withdrawal') {
            newBalance -= parseFloat(amount);
        }

        await fund.update({ balance: newBalance }, { transaction });

        await transaction.commit();

        const createdTransaction = await FundTransaction.findByPk(fundTransaction.id, {
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'firstName', 'lastName']
            }]
        });

        res.status(201).json(createdTransaction);
    } catch (error) {
        await transaction.rollback();
        console.error('Create fund transaction error:', error);
        res.status(500).json({ error: 'Failed to create fund transaction' });
    }
};

module.exports = {
    getAllFunds,
    getFundById,
    createFund,
    updateFund,
    getFundTransactions,
    createFundTransaction
};
