const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admissionController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get active admissions
router.get('/active', admissionController.getActiveAdmissions);

// Admit a patient
router.post('/admit', admissionController.admitPatient);

module.exports = router;
