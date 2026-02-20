const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authMiddleware, authorize, checkPermission } = require('../middleware/auth');

const upload = require('../middleware/upload');

// All patient routes require authentication
router.use(authMiddleware);

router.get('/', checkPermission('patients', 'read'), patientController.getAllPatients);
router.get('/:id', checkPermission('patients', 'read'), patientController.getPatient);
router.post('/', checkPermission('patients', 'write'), upload.single('photo'), patientController.createPatient);
router.post('/merge', checkPermission('patients', 'write'), patientController.mergePatients); // New merge route
router.put('/:id', checkPermission('patients', 'write'), upload.single('photo'), patientController.updatePatient);
router.delete('/:id', checkPermission('patients', 'delete'), patientController.deletePatient);

module.exports = router;
