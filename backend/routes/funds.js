const express = require('express');
const router = express.Router();
const fundController = require('../controllers/fundController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All fund routes require authentication
router.use(authMiddleware);

// Fund routes
router.get('/', fundController.getAllFunds);
router.get('/:id', fundController.getFundById);
router.post('/', authorize('admin', 'accountant'), fundController.createFund);
router.put('/:id', authorize('admin', 'accountant'), fundController.updateFund);

// Fund transaction routes
router.get('/:id/transactions', fundController.getFundTransactions);
router.post('/:id/transactions', authorize('admin', 'accountant'), fundController.createFundTransaction);

module.exports = router;
