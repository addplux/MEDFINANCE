const { JournalEntry, JournalLine, ChartOfAccounts, sequelize } = require('../models');

/**
 * Post a Scheme Invoice to the General Ledger
 * Debit: Accounts Receivable (1200)
 * Credit: Service Revenue (4000)
 * @param {Object} invoice - The SchemeInvoice object
 * @param {Object} t - Transaction object
 */
const postSchemeInvoice = async (invoice, t) => {
    try {
        // 1. Get Accounts
        // In a real app, these codes should be configurable or fetched via a settings table
        const arAccount = await ChartOfAccounts.findOne({ where: { accountCode: '1200' } }); // Accounts Receivable
        const revenueAccount = await ChartOfAccounts.findOne({ where: { accountCode: '4000' } }); // Service Revenue

        if (!arAccount || !revenueAccount) {
            console.warn('GL Posting Skipped: Default accounts (1200, 4000) not found.');
            return;
        }

        // 2. Create Journal Entry
        // Ensure unique entry number
        const entryCount = await JournalEntry.count({ transaction: t });
        const entryNumber = `JE-INV-${invoice.invoiceNumber}`;

        const entry = await JournalEntry.create({
            entryNumber,
            entryDate: new Date(),
            description: `Invoice Generated: ${invoice.invoiceNumber} (Scheme: ${invoice.schemeId})`,
            reference: invoice.invoiceNumber,
            totalDebit: invoice.totalAmount,
            totalCredit: invoice.totalAmount,
            status: 'posted', // Auto-post immediately
            createdBy: invoice.generatedBy,
            postedBy: invoice.generatedBy,
            postedAt: new Date()
        }, { transaction: t });

        // 3. Create Journal Lines
        // Debit AR
        await JournalLine.create({
            entryId: entry.id,
            accountId: arAccount.id,
            debit: invoice.totalAmount,
            credit: 0,
            description: `Invoice ${invoice.invoiceNumber}`
        }, { transaction: t });

        // Credit Revenue
        await JournalLine.create({
            entryId: entry.id,
            accountId: revenueAccount.id,
            debit: 0,
            credit: invoice.totalAmount,
            description: `Revenue from Invoice ${invoice.invoiceNumber}`
        }, { transaction: t });

        // 4. Update Account Balances
        // Asset (AR) increases with Debit
        await arAccount.increment('balance', { by: invoice.totalAmount, transaction: t });
        // Revenue (Equity/Income) increases with Credit
        await revenueAccount.increment('balance', { by: invoice.totalAmount, transaction: t });

        console.log(`GL Posted: Invoice ${invoice.invoiceNumber}`);

    } catch (error) {
        console.error('Failed to post Scheme Invoice to GL:', error);
        // We don't throw here to avoid rolling back the main transaction if GL fails? 
        // Or strictly we SHOULD throw? 
        // Let's throw to ensure data integrity - if invoice exists, GL must exist.
        throw error;
    }
};

/**
 * Post a Payment to the General Ledger
 * Debit: Cash/Bank (1000)
 * Credit: Accounts Receivable (1200) - If paying off an invoice/balance
 * @param {Object} payment - The Payment object
 * @param {Object} t - Transaction object
 */
const postPayment = async (payment, t) => {
    try {
        // 1. Get Accounts
        const cashAccount = await ChartOfAccounts.findOne({ where: { accountCode: '1000' } }); // Cash on Hand
        const arAccount = await ChartOfAccounts.findOne({ where: { accountCode: '1200' } }); // Accounts Receivable

        if (!cashAccount || !arAccount) {
            console.warn('GL Posting Skipped: Default accounts (1000, 1200) not found.');
            return;
        }

        // 2. Create Journal Entry
        const entryCount = await JournalEntry.count({ transaction: t });
        const entryNumber = `JE-PAY-${payment.receiptNumber}`;

        const entry = await JournalEntry.create({
            entryNumber,
            entryDate: payment.paymentDate,
            description: `Payment Received: ${payment.receiptNumber} (${payment.paymentMethod})`,
            reference: payment.receiptNumber,
            totalDebit: payment.amount,
            totalCredit: payment.amount,
            status: 'posted',
            createdBy: payment.receivedBy,
            postedBy: payment.receivedBy,
            postedAt: new Date()
        }, { transaction: t });

        // 3. Create Journal Lines
        // Debit Cash
        await JournalLine.create({
            entryId: entry.id,
            accountId: cashAccount.id,
            debit: payment.amount,
            credit: 0,
            description: `Payment ${payment.receiptNumber}`
        }, { transaction: t });

        // Credit AR
        await JournalLine.create({
            entryId: entry.id,
            accountId: arAccount.id,
            debit: 0,
            credit: payment.amount,
            description: `Payment for Account`
        }, { transaction: t });

        // 4. Update Account Balances
        // Asset (Cash) increases with Debit
        await cashAccount.increment('balance', { by: payment.amount, transaction: t });
        // Asset (AR) decreases with Credit (so we add a negative, or logic handles it?)
        // Wait, 'balance' in database is usually a signed value or context dependent?
        // In this system, Assets: Debit +, Credit -. 
        // So crediting AR reduces its balance.
        // sequelize increment adds. So we add -(amount).
        // Let's check ledgerController logic:
        // "For asset... debit increases balance... balanceChange = debit - credit"
        // So if credit is 100, balanceChange is -100.
        // Account update: balance + balanceChange.

        await cashAccount.increment('balance', { by: payment.amount, transaction: t });
        await arAccount.increment('balance', { by: -payment.amount, transaction: t });

        console.log(`GL Posted: Payment ${payment.receiptNumber}`);

    } catch (error) {
        console.error('Failed to post Payment to GL:', error);
        throw error;
    }
};

module.exports = {
    postSchemeInvoice,
    postPayment
};
