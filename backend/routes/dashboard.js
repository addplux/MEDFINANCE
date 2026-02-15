const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authMiddleware);

router.get('/overview', dashboardController.getOverview);
router.get('/recent-activities', dashboardController.getRecentActivities);
router.get('/revenue-chart', dashboardController.getRevenueChart);

module.exports = router;
