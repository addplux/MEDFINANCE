const { ChartOfAccounts, JournalEntry, JournalLine, sequelize } = require('../models');

// ========== Chart of Accounts ==========

// Get all accounts
const getAllAccounts = async (req, res) => {
    try {
        const { accountType } = req.query;

        const where = { isActive: true };
        if (accountType) where.accountType = accountType;

        const accounts = await ChartOfAccounts.findAll({
            where,
            order: [['accountCode', 'ASC']],
            include: [
                { association: 'parent', attributes: ['id', 'accountCode', 'accountName'] },
                { association: 'children', attributes: ['id', 'accountCode', 'accountName'] }
            ]
        });

        res.json(accounts);
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ error: 'Failed to get chart of accounts' });
    }
};

// Create account
const createAccount = async (req, res) => {
    try {
        const { accountCode, accountName, accountType, parentId, description } = req.body;

        if (!accountCode || !accountName || !accountType) {
            return res.status(400).json({ error: 'Account code, name, and type are required' });
        }

        const account = await ChartOfAccounts.create({
            accountCode,
            accountName,
            accountType,
            parentId,
            description
        });

        res.status(201).json(account);
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
};

// ========== Journal Entries ==========

// Get all journal entries
const getAllJournalEntries = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const { count, rows } = await JournalEntry.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['entryDate', 'DESC']],
            include: [
                {
                    association: 'lines',
                    include: [{ association: 'account', attributes: ['id', 'accountCode', 'accountName'] }]
                },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
                { association: 'poster', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Get journal entries error:', error);
        res.status(500).json({ error: 'Failed to get journal entries' });
    }
};

// Get single journal entry
const getJournalEntry = async (req, res) => {
    try {
        const entry = await JournalEntry.findByPk(req.params.id, {
            include: [
                {
                    association: 'lines',
                    include: [{ association: 'account' }]
                },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
                { association: 'poster', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        if (!entry) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        res.json(entry);
    } catch (error) {
        console.error('Get journal entry error:', error);
        res.status(500).json({ error: 'Failed to get journal entry' });
    }
};

// Create journal entry
const createJournalEntry = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { entryDate, description, reference, lines } = req.body;

        if (!entryDate || !description || !lines || lines.length < 2) {
            return res.status(400).json({ error: 'Entry date, description, and at least 2 lines are required' });
        }

        // Validate debits = credits
        const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
        const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return res.status(400).json({ error: 'Total debits must equal total credits' });
        }

        // Generate entry number
        const entryCount = await JournalEntry.count();
        const entryNumber = `JE${String(entryCount + 1).padStart(6, '0')}`;

        // Create journal entry
        const entry = await JournalEntry.create({
            entryNumber,
            entryDate,
            description,
            reference,
            totalDebit,
            totalCredit,
            createdBy: req.user.id
        }, { transaction: t });

        // Create journal lines
        for (const line of lines) {
            await JournalLine.create({
                entryId: entry.id,
                accountId: line.accountId,
                debit: parseFloat(line.debit || 0),
                credit: parseFloat(line.credit || 0),
                description: line.description
            }, { transaction: t });
        }

        await t.commit();

        // Fetch with associations
        const createdEntry = await JournalEntry.findByPk(entry.id, {
            include: [
                {
                    association: 'lines',
                    include: [{ association: 'account' }]
                },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json(createdEntry);
    } catch (error) {
        await t.rollback();
        console.error('Create journal entry error:', error);
        res.status(500).json({ error: 'Failed to create journal entry' });
    }
};

// Post journal entry
const postJournalEntry = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const entry = await JournalEntry.findByPk(req.params.id, {
            include: [{ association: 'lines', include: ['account'] }]
        });

        if (!entry) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        if (entry.status !== 'draft') {
            return res.status(400).json({ error: 'Only draft entries can be posted' });
        }

        // Update account balances
        for (const line of entry.lines) {
            const account = line.account;
            const debit = parseFloat(line.debit);
            const credit = parseFloat(line.credit);

            // For asset and expense accounts, debit increases balance
            // For liability, equity, and revenue accounts, credit increases balance
            let balanceChange = 0;
            if (['asset', 'expense'].includes(account.accountType)) {
                balanceChange = debit - credit;
            } else {
                balanceChange = credit - debit;
            }

            await account.update({
                balance: parseFloat(account.balance) + balanceChange
            }, { transaction: t });
        }

        // Update entry status
        await entry.update({
            status: 'posted',
            postedBy: req.user.id,
            postedAt: new Date()
        }, { transaction: t });

        await t.commit();

        const postedEntry = await JournalEntry.findByPk(entry.id, {
            include: [
                { association: 'lines', include: ['account'] },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
                { association: 'poster', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json(postedEntry);
    } catch (error) {
        await t.rollback();
        console.error('Post journal entry error:', error);
        res.status(500).json({ error: 'Failed to post journal entry' });
    }
};

// Get trial balance
const getTrialBalance = async (req, res) => {
    try {
        const { asOfDate } = req.query;

        const accounts = await ChartOfAccounts.findAll({
            where: { isActive: true },
            order: [['accountCode', 'ASC']]
        });

        const trialBalance = accounts.map(account => {
            const balance = parseFloat(account.balance);
            return {
                accountCode: account.accountCode,
                accountName: account.accountName,
                accountType: account.accountType,
                debit: balance >= 0 ? balance : 0,
                credit: balance < 0 ? Math.abs(balance) : 0
            };
        });

        const totalDebit = trialBalance.reduce((sum, item) => sum + item.debit, 0);
        const totalCredit = trialBalance.reduce((sum, item) => sum + item.credit, 0);

        res.json({
            asOfDate: asOfDate || new Date().toISOString().split('T')[0],
            accounts: trialBalance,
            totalDebit,
            totalCredit,
            balanced: Math.abs(totalDebit - totalCredit) < 0.01
        });
    } catch (error) {
        console.error('Get trial balance error:', error);
        res.status(500).json({ error: 'Failed to get trial balance' });
    }
};

module.exports = {
    getAllAccounts,
    createAccount,
    getAllJournalEntries,
    getJournalEntry,
    createJournalEntry,
    postJournalEntry,
    getTrialBalance
};
