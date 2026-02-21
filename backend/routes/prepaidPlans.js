const express = require('express');
const router = express.Router();
const { getAllPlans, getPlan, createPlan, updatePlan, deletePlan } = require('../controllers/prepaidPlanController');
const { authMiddleware, checkPermission } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', checkPermission('patients', 'read'), getAllPlans);
router.get('/:id', checkPermission('patients', 'read'), getPlan);
router.post('/', checkPermission('patients', 'write'), createPlan);
router.put('/:id', checkPermission('patients', 'write'), updatePlan);
router.delete('/:id', checkPermission('patients', 'delete'), deletePlan);

module.exports = router;
