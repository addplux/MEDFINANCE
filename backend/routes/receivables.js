const express = require('express');
const router = express.Router();
const receivablesController = require('../controllers/receivablesController');
const { authMiddleware, authorize } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All receivables routes require authentication
router.use(authMiddleware);


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
router.get('/invoices', receivablesController.getAllInvoices); // Global list
router.post('/invoices/manual-claim', authorize('admin', 'accountant'), receivablesController.submitManualClaim);
router.post('/schemes/invoices/generate', authorize('admin', 'accountant'), receivablesController.generateMonthlyInvoice);
router.get('/schemes/:id/invoices', receivablesController.getSchemeInvoices);
router.get('/invoices/:id', receivablesController.getSchemeInvoice);
router.put('/invoices/:id/status', authorize('admin', 'accountant'), receivablesController.updateInvoiceStatus);
router.get('/invoices/:id/pdf', receivablesController.downloadSchemeInvoicePdf);
router.get('/invoices/:id/wohms', receivablesController.exportInvoiceToWOHMS);
router.post('/invoices/:id/send', authorize('admin', 'accountant'), receivablesController.sendSchemeInvoiceEmail);

// Bulk Import
router.post('/schemes/:id/import', authorize('admin', 'accountant'), upload.single('file'), receivablesController.importSchemeMembers);

// Add single member
router.post('/schemes/:id/members/add', authorize('admin', 'accountant'), receivablesController.addSchemeMember);

// Update member status
router.put('/schemes/:id/members/:patientId/status', authorize('admin', 'accountant'), receivablesController.updateMemberStatus);

module.exports = router;
