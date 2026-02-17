const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authMiddleware, authorize, checkPermission } = require('../middleware/auth');

// All patient routes require authentication
router.use(authMiddleware);

router.get('/', checkPermission('patients', 'read'), patientController.getAllPatients);
router.get('/:id', checkPermission('patients', 'read'), patientController.getPatient);
router.post('/', checkPermission('patients', 'write'), patientController.createPatient);
router.put('/:id', checkPermission('patients', 'write'), patientController.updatePatient);
router.delete('/:id', checkPermission('patients', 'delete'), patientController.deletePatient);

module.exports = router;
