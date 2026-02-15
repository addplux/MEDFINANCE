const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authMiddleware } = require('../middleware/auth');

// All report routes require authentication
router.use(authMiddleware);

router.get('/revenue', reportsController.getRevenueReport);
router.get('/cashflow', reportsController.getCashflowReport);
router.get('/department-profitability', reportsController.getDepartmentProfitability);
router.get('/billing-summary', reportsController.getBillingSummary);

module.exports = router;
