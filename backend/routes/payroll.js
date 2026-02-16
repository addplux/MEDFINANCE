const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get all deductions (Admin only or authorized roles)
router.get('/deductions', authMiddleware, authorize('admin', 'accountant', 'hr'), payrollController.getDeductions);

// Get staff balances (Admin only)
router.get('/balances', authMiddleware, authorize('admin', 'accountant', 'hr'), payrollController.getStaffBalances);

// Create a new deduction
router.post('/deductions', authMiddleware, authorize('admin', 'accountant', 'hr'), payrollController.createDeduction);

// Update status
router.put('/deductions/:id', authMiddleware, authorize('admin', 'accountant', 'hr'), payrollController.updateDeductionStatus);

module.exports = router;
