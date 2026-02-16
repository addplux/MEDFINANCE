const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const { authMiddleware: authenticateToken, authorize } = require('../middleware/auth');

// Inventory Management
router.get('/', authenticateToken, pharmacyController.getAllMedications);
router.post('/', authenticateToken, authorize(['admin', 'pharmacist']), pharmacyController.createMedication);
router.put('/:id', authenticateToken, authorize(['admin', 'pharmacist']), pharmacyController.updateMedication);

// Stock Management (GRN)
router.post('/grn', authenticateToken, authorize(['admin', 'pharmacist']), pharmacyController.receiveStock);
router.get('/batch/:medicationId', authenticateToken, pharmacyController.getBatches);

// Dispensing
router.post('/dispense', authenticateToken, authorize(['admin', 'pharmacist', 'billing_staff']), pharmacyController.dispenseMedication);

module.exports = router;
