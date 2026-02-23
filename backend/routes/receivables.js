const express = require('express');
const router = express.Router();
const receivablesController = require('../controllers/receivablesController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All receivables routes require authentication
router.use(authMiddleware);

// NHIMA Claims
router.get('/nhima', receivablesController.getAllNHIMAClaims);
router.post('/nhima', authorize('admin', 'accountant'), receivablesController.createNHIMAClaim);
router.put('/nhima/:id', authorize('admin', 'accountant'), receivablesController.updateNHIMAClaim);

// Corporate Accounts
router.get('/corporate', receivablesController.getAllCorporateAccounts);
router.post('/corporate', authorize('admin', 'accountant'), receivablesController.createCorporateAccount);

// Services (For Dropdowns)
router.get('/services', receivablesController.getAllServices);

// Schemes
router.get('/schemes', receivablesController.getAllSchemes);
router.post('/schemes', authorize('admin', 'accountant'), receivablesController.createScheme);
router.put('/schemes/:id', authorize('admin', 'accountant'), receivablesController.updateScheme);
router.get('/schemes/:id', receivablesController.getSchemeById);
router.get('/schemes/:id/statement', receivablesController.getSchemeStatement);
router.get('/schemes/:id/members', receivablesController.getSchemeMembers);
router.get('/schemes/ledger/:policyNumber', receivablesController.getFamilyLedger);

// Scheme Invoices
router.post('/schemes/invoices/generate', authorize('admin', 'accountant'), receivablesController.generateMonthlyInvoice);
router.get('/schemes/:id/invoices', receivablesController.getSchemeInvoices);
router.get('/schemes/invoices/:id', receivablesController.getSchemeInvoice);

// Bulk Import
router.post('/schemes/:id/import', authorize('admin', 'accountant'), receivablesController.importSchemeMembers);

module.exports = router;
