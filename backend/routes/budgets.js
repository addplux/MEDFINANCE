const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All budget routes require authentication
router.use(authMiddleware);

router.get('/', budgetController.getAllBudgets);
router.get('/variance-analysis', budgetController.getVarianceAnalysis);
router.get('/:id', budgetController.getBudget);
router.post('/', authorize('admin', 'accountant'), budgetController.createBudget);
router.put('/:id', authorize('admin', 'accountant'), budgetController.updateBudget);
router.post('/:id/approve', authorize('admin'), budgetController.approveBudget);

module.exports = router;
