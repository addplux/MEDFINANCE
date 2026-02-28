const express = require('express');
const router = express.Router();
const maternityController = require('../controllers/maternityController');
const { authMiddleware, authorize } = require('../middleware/auth');

const CLINICAL = ['doctor', 'nurse', 'superintendent', 'admin'];

// All routes require authentication
router.use(authMiddleware);

// Maternity bill routes
router.post('/bills', authorize(...CLINICAL), maternityController.createMaternityBill);
router.get('/bills', authorize(...CLINICAL), maternityController.getAllMaternityBills);
router.get('/bills/:id', authorize(...CLINICAL), maternityController.getMaternityBillById);
router.put('/bills/:id', authorize(...CLINICAL), maternityController.updateMaternityBill);
router.delete('/bills/:id', authorize('superintendent', 'admin'), maternityController.deleteMaternityBill);

// Statistics & Revenue
router.get('/revenue', authorize('accountant', 'superintendent', 'admin'), maternityController.getMaternityRevenue);
router.get('/statistics', authorize('accountant', 'doctor', 'superintendent', 'admin'), maternityController.getDeliveryStats);

module.exports = router;
