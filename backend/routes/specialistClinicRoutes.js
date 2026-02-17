const express = require('express');
const router = express.Router();
const specialistClinicController = require('../controllers/specialistClinicController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Specialist clinic bill routes
router.post('/bills', specialistClinicController.createSpecialistBill);
router.get('/bills', specialistClinicController.getAllSpecialistBills);
router.get('/bills/:id', specialistClinicController.getSpecialistBillById);
router.put('/bills/:id', specialistClinicController.updateSpecialistBill);
router.delete('/bills/:id', specialistClinicController.deleteSpecialistBill);

// Statistics
router.get('/revenue', specialistClinicController.getSpecialistRevenue);
router.get('/statistics', specialistClinicController.getClinicStats);

module.exports = router;
