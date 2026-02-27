const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All cash routes require authentication
router.use(authMiddleware);

// Payments
router.get('/payments', cashController.getAllPayments);
router.post('/payments', authorize('admin', 'billing_staff', 'accountant'), cashController.createPayment);
router.get('/payments/:id/receipt', cashController.getPaymentReceipt);

// Bank Accounts
router.get('/bank-accounts', cashController.getAllBankAccounts);
router.post('/bank-accounts', authorize('admin', 'accountant'), cashController.createBankAccount);

// Petty Cash
router.get('/petty-cash', cashController.getAllPettyCash);
router.post('/petty-cash', authorize('admin', 'accountant'), cashController.createPettyCash);
router.post('/petty-cash/:id/approve', authorize('admin', 'accountant'), cashController.approvePettyCash);

module.exports = router;
