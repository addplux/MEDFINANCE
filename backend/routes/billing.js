const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All billing routes require authentication
router.use(authMiddleware);

// OPD Bills
router.get('/opd', billingController.getAllOPDBills);
router.get('/opd/:id', billingController.getOPDBill);
router.post('/opd', authorize('admin', 'billing_staff'), billingController.createOPDBill);
router.put('/opd/:id', authorize('admin', 'billing_staff'), billingController.updateOPDBill);
router.delete('/opd/:id', authorize('admin'), billingController.deleteOPDBill);

// Patient Financials
router.get('/pending-queue', billingController.getPendingQueue);
router.get('/patient/:id/balance', billingController.getPatientBalance);
router.get('/patient/:id/unpaid', billingController.getUnpaidPatientBills);
router.get('/patient/:id/statement', billingController.getPatientStatement);

module.exports = router;
