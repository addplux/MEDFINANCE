const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authMiddleware, authorize, checkPermission } = require('../middleware/auth');

const upload = require('../middleware/upload');

// All patient routes require authentication
router.use(authMiddleware);

const uploadExcel = require('multer')({ storage: require('multer').memoryStorage() });

router.post('/upload-prepaid-ledger', checkPermission('patients', 'write'), uploadExcel.single('file'), patientController.uploadPrepaidLedger);

router.get('/', checkPermission('patients', 'read'), patientController.getAllPatients);
router.post('/merge', checkPermission('patients', 'write'), patientController.mergePatients);
router.get('/:id', checkPermission('patients', 'read'), patientController.getPatient);
router.get('/:id/visit-history', checkPermission('patients', 'read'), patientController.getVisitHistory);
router.post('/', checkPermission('patients', 'write'), upload.single('photo'), patientController.createPatient);
router.put('/:id', checkPermission('patients', 'write'), upload.single('photo'), patientController.updatePatient);
router.post('/:id/topup', checkPermission('patients', 'write'), patientController.topupPrepaidBalance);
router.delete('/:id', checkPermission('patients', 'delete'), patientController.deletePatient);

module.exports = router;

