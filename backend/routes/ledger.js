const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All ledger routes require authentication
router.use(authMiddleware);

// Chart of Accounts
router.get('/accounts', ledgerController.getAllAccounts);
router.post('/accounts', authorize('admin', 'accountant'), ledgerController.createAccount);

// Journal Entries
router.get('/journal-entries', ledgerController.getAllJournalEntries);
router.get('/journal-entries/:id', ledgerController.getJournalEntry);
router.post('/journal-entries', authorize('admin', 'accountant'), ledgerController.createJournalEntry);
router.post('/journal-entries/:id/post', authorize('admin', 'accountant'), ledgerController.postJournalEntry);

// Trial Balance
router.get('/trial-balance', ledgerController.getTrialBalance);

module.exports = router;
