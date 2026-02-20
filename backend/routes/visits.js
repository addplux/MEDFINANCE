const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const visitController = require('../controllers/visitController');

// All routes are protected
router.use(authMiddleware);

router.get('/', checkPermission('patients', 'read'), visitController.getAllVisits);
router.post('/', checkPermission('patients', 'write'), visitController.createVisit);
router.get('/:id', checkPermission('patients', 'read'), visitController.getVisit);
router.put('/:id', checkPermission('patients', 'write'), visitController.updateVisit);
router.post('/:id/discharge', checkPermission('patients', 'write'), visitController.dischargeVisit);
router.get('/:id/movements', checkPermission('patients', 'read'), visitController.getVisitMovements);

module.exports = router;
