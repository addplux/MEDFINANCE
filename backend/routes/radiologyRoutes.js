const express = require('express');
const router = require('express').Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const radiologyController = require('../controllers/radiologyController');

// All radiology routes should require authentication
router.use(authMiddleware);

// Get all requests
router.get('/requests', authorize('SA', 'DOCTOR', 'NURSE', 'RADIOLOGIST'), radiologyController.getAllRequests);

// Create new radiology request
router.post('/requests', authorize('SA', 'DOCTOR', 'NURSE'), radiologyController.createRequest);

// Update radiology request status (payment gate enforced)
router.patch('/requests/:id/status', radiologyController.updateRequestStatus);

module.exports = router;
