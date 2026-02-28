const express = require('express');
const router = require('express').Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const radiologyController = require('../controllers/radiologyController');

const LAB_RADIOLOGY = ['radiographer', 'doctor', 'nurse', 'superintendent', 'admin'];
const DOCTOR_NURSE = ['doctor', 'nurse', 'superintendent', 'admin'];

// All radiology routes require authentication
router.use(authMiddleware);

// Get all requests — radiographer, doctor, nurse can view
router.get('/requests', authorize(...LAB_RADIOLOGY), radiologyController.getAllRequests);

// Create new radiology request — doctors and nurses submit requests
router.post('/requests', authorize(...DOCTOR_NURSE), radiologyController.createRequest);

// Update request status — radiographer processes the scan; admin can override
router.patch('/requests/:id/status', authorize('radiographer', 'doctor', 'superintendent', 'admin'), radiologyController.updateRequestStatus);

module.exports = router;
