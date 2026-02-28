const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { authMiddleware, authorize } = require('../middleware/auth');

const LAB_ALL = ['lab_technician', 'doctor', 'nurse', 'superintendent', 'admin'];
const LAB_MANAGE = ['lab_technician', 'superintendent', 'admin'];
const DOCTOR_ADMIN = ['doctor', 'superintendent', 'admin'];

// Test Management — Admin sets up available tests
router.get('/tests', authMiddleware, labController.getAllTests);
router.post('/tests', authMiddleware, authorize('superintendent', 'admin'), labController.createTest);
router.put('/tests/:id', authMiddleware, authorize('superintendent', 'admin'), labController.updateTest);

// Requests — Doctors/nurses create requests; lab staff see and process them
router.post('/requests', authMiddleware, authorize(...DOCTOR_ADMIN, 'nurse'), labController.createRequest);
router.get('/requests', authMiddleware, authorize(...LAB_ALL), labController.getRequests);
router.patch('/requests/:id/status', authMiddleware, authorize(...LAB_MANAGE, 'doctor'), labController.updateRequestStatus);

// Results — Only lab technicians can enter results
router.post('/results', authMiddleware, authorize(...LAB_MANAGE), labController.enterResults);

module.exports = router;
