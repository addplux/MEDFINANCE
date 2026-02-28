const express = require('express');
const router = express.Router();
const theatreController = require('../controllers/theatreController');
const { authMiddleware, authorize } = require('../middleware/auth');

const CLINICAL = ['doctor', 'nurse', 'superintendent', 'admin'];
const DOCTOR_ADMIN = ['doctor', 'superintendent', 'admin'];

// All routes require authentication
router.use(authMiddleware);

// Theatre bill routes
router.post('/bills', authorize(...CLINICAL), theatreController.createTheatreBill);
router.get('/bills', authorize(...CLINICAL), theatreController.getAllTheatreBills);
router.get('/bills/:id', authorize(...CLINICAL), theatreController.getTheatreBillById);
router.put('/bills/:id', authorize(...CLINICAL), theatreController.updateTheatreBill);
router.put('/bills/:id/complete', authorize(...DOCTOR_ADMIN), theatreController.completeOperation);
router.delete('/bills/:id', authorize('superintendent', 'admin'), theatreController.deleteTheatreBill);

// Revenue statistics
router.get('/revenue', authorize('accountant', 'superintendent', 'admin'), theatreController.getTheatreRevenue);

module.exports = router;
