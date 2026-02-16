const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { authMiddleware: authenticateToken, authorize } = require('../middleware/auth');

// Test Management
router.get('/tests', authenticateToken, labController.getAllTests);
router.post('/tests', authenticateToken, authorize(['admin', 'lab_manager']), labController.createTest);
router.put('/tests/:id', authenticateToken, authorize(['admin', 'lab_manager']), labController.updateTest);

// Requests
router.post('/requests', authenticateToken, labController.createRequest);
router.get('/requests', authenticateToken, labController.getRequests);
router.patch('/requests/:id/status', authenticateToken, labController.updateRequestStatus);

// Results
router.post('/results', authenticateToken, authorize(['admin', 'lab_technician', 'lab_manager']), labController.enterResults);

module.exports = router;
