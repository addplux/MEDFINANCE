const { Fund, FundTransaction, User, ChartOfAccounts, JournalEntry, JournalLine, sequelize } = require('../models');

// Get all funds
const getAllFunds = async (req, res) => {
    try {
        const { status } = req.query;

        const where = {};
        if (status) where.status = status;

        const funds = await Fund.findAll({
            where,
            order: [['fundName', 'ASC']],
            include: [
                { association: 'account', attributes: ['id', 'accountCode', 'accountName', 'accountType'] },
                {
                    model: FundTransaction,
                    as: 'transactions',
                    limit: 5,
                    order: [['transactionDate', 'DESC']],
                    include: [{
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'firstName', 'lastName']
                    }]
                }
            ]
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
            include: [
                { association: 'account' },
                {
                    model: FundTransaction,
                    as: 'transactions',
                    order: [['transactionDate', 'DESC']],
                    include: [{
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'firstName', 'lastName']
                    }]
                }
            ]
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
        const { fundName, fundType, accountId, purpose, description } = req.body;

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
        const fundCode = `${typePrefix[fundType] || 'FND'}${String(fundCount + 1).padStart(4, '0')}`;

        const fund = await Fund.create({
            fundCode,
            fundName,
            fundType,
            accountId,
            purpose,
            description,
            balance: 0
        });

        res.status(201).json(fund);
    } catch (error) {
        console.error('Create fund error:', error);
        res.status(500).json({ error: 'Failed to create fund', details: error.message });
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

// Create fund transaction + Journal Entry
const createFundTransaction = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { transactionType, amount, description, referenceNumber, transactionDate, offsetAccountId } = req.body;

        if (!transactionType || !amount) {
            await t.rollback();
            return res.status(400).json({ error: 'Transaction type and amount are required' });
        }

        const amt = parseFloat(amount);
        const fund = await Fund.findByPk(req.params.id, { 
            include: ['account'],
            transaction: t 
        });

        if (!fund) {
            await t.rollback();
            return res.status(404).json({ error: 'Fund not found' });
        }

        // 1. Create Fund Transaction record
        const fundTransaction = await FundTransaction.create({
            fundId: fund.id,
            transactionType,
            amount: amt,
            description,
            referenceNumber,
            transactionDate: transactionDate || new Date(),
            createdBy: req.user.id
        }, { transaction: t });

        // 2. Update fund balance
        let newBalance = parseFloat(fund.balance);
        if (transactionType === 'deposit') {
            newBalance += amt;
        } else if (transactionType === 'withdrawal') {
            newBalance -= amt;
        }
        await fund.update({ balance: newBalance }, { transaction: t });

        // 3. Create Journal Entry if fund is linked to an account
        if (fund.accountId) {
            const entryCount = await JournalEntry.count({ transaction: t });
            const entryNumber = `FJE${String(entryCount + 1).padStart(6, '0')}`;
            
            const journalEntry = await JournalEntry.create({
                entryNumber,
                entryDate: transactionDate || new Date(),
                description: `Fund ${transactionType.toUpperCase()}: ${fund.fundName} - ${description}`,
                reference: referenceNumber || `FUND-${fund.fundCode}`,
                totalDebit: amt,
                totalCredit: amt,
                status: 'posted', // Auto-post fund transactions
                createdBy: req.user.id,
                postedBy: req.user.id,
                postedAt: new Date()
            }, { transaction: t });

            // Journal Lines
            // If Deposit: Debit Cash/Asset (offsetAccountId), Credit Fund Liability (fund.accountId)
            // If Withdrawal: Debit Fund Liability (fund.accountId), Credit Cash/Asset (offsetAccountId)
            
            const line1 = {
                entryId: journalEntry.id,
                accountId: transactionType === 'deposit' ? offsetAccountId : fund.accountId,
                debit: amt,
                credit: 0,
                description: description || `Fund ${transactionType}`
            };

            const line2 = {
                entryId: journalEntry.id,
                accountId: transactionType === 'deposit' ? fund.accountId : offsetAccountId,
                debit: 0,
                credit: amt,
                description: description || `Fund ${transactionType}`
            };

            await JournalLine.bulkCreate([line1, line2], { transaction: t });

            // Update Chart of Accounts balances
            for (const line of [line1, line2]) {
                const account = await ChartOfAccounts.findByPk(line.accountId, { transaction: t });
                if (account) {
                    let balanceChange = 0;
                    if (['asset', 'expense'].includes(account.accountType)) {
                        balanceChange = line.debit - line.credit;
                    } else {
                        balanceChange = line.credit - line.debit;
                    }
                    await account.update({
                        balance: parseFloat(account.balance) + balanceChange
                    }, { transaction: t });
                }
            }
        }

        await t.commit();

        const createdTransaction = await FundTransaction.findByPk(fundTransaction.id, {
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'firstName', 'lastName']
            }]
        });

        res.status(201).json(createdTransaction);
    } catch (error) {
        if (t) await t.rollback();
        console.error('Create fund transaction error:', error);
        res.status(500).json({ error: 'Failed to create fund transaction', details: error.message });
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
