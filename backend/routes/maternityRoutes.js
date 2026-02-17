const express = require('express');
const router = express.Router();
const maternityController = require('../controllers/maternityController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Maternity bill routes
router.post('/bills', maternityController.createMaternityBill);
router.get('/bills', maternityController.getAllMaternityBills);
router.get('/bills/:id', maternityController.getMaternityBillById);
router.put('/bills/:id', maternityController.updateMaternityBill);
router.delete('/bills/:id', maternityController.deleteMaternityBill);

// Statistics
router.get('/revenue', maternityController.getMaternityRevenue);
router.get('/statistics', maternityController.getDeliveryStats);

module.exports = router;
