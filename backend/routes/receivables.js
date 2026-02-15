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

// Schemes
router.get('/schemes', receivablesController.getAllSchemes);
router.post('/schemes', authorize('admin', 'accountant'), receivablesController.createScheme);

module.exports = router;
