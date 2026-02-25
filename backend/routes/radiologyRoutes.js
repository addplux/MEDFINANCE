const express = require('require');
const router = require('express').Router();
const { auth, checkRole } = require('../middleware/auth');
const radiologyController = require('../controllers/radiologyController');

// All radiology routes should require authentication
router.use(auth);

// Get all requests
router.get('/requests', Array.isArray(checkRole(['SA', 'DOCTOR', 'NURSE', 'RADIOLOGIST'])) ? checkRole(['SA', 'DOCTOR', 'NURSE', 'RADIOLOGIST']) : (req, res, next) => next(), radiologyController.getAllRequests);

// Create new radiology request
router.post('/requests', Array.isArray(checkRole(['SA', 'DOCTOR', 'NURSE'])) ? checkRole(['SA', 'DOCTOR', 'NURSE']) : (req, res, next) => next(), radiologyController.createRequest);

module.exports = router;
