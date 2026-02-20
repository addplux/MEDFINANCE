const express = require('express');
const router = express.Router();
const { getPatientMovements, createMovement } = require('../controllers/patientMovementController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:patientId', authMiddleware, getPatientMovements);
router.post('/', authMiddleware, createMovement);

module.exports = router;
