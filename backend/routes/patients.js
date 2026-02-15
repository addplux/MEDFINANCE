const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All patient routes require authentication
router.use(authMiddleware);

router.get('/', patientController.getAllPatients);
router.get('/:id', patientController.getPatient);
router.post('/', authorize('admin', 'billing_staff'), patientController.createPatient);
router.put('/:id', authorize('admin', 'billing_staff'), patientController.updatePatient);
router.delete('/:id', authorize('admin'), patientController.deletePatient);

module.exports = router;
