const express = require('express');
const router = express.Router();
const payablesController = require('../controllers/payablesController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All payables routes require authentication
router.use(authMiddleware);

// Suppliers
router.get('/suppliers', payablesController.getAllSuppliers);
router.post('/suppliers', authorize('admin', 'accountant'), payablesController.createSupplier);

// Invoices
router.get('/invoices', payablesController.getAllInvoices);
router.post('/invoices', authorize('admin', 'accountant'), payablesController.createInvoice);

// Payment Vouchers
router.get('/payment-vouchers', payablesController.getAllPaymentVouchers);
router.post('/payment-vouchers', authorize('admin', 'accountant'), payablesController.createPaymentVoucher);

module.exports = router;
