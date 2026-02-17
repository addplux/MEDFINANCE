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
router.get('/wing-revenue', reportsController.getWingRevenue);
router.get('/department-revenue', reportsController.getDepartmentRevenue);
router.get('/cashier-performance', reportsController.getCashierPerformance);
router.get('/collection-summary', reportsController.getCollectionSummary);

module.exports = router;
