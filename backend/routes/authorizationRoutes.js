const express = require('express');
const router = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const {
    getPendingAuthorizations,
    approveAuthorization,
    rejectAuthorization
} = require('../controllers/authorizationController');

// All routes require authentication
router.use(authenticateToken);

// GET  /api/authorization         — list all pending_authorization visits
router.get('/', getPendingAuthorizations);

// PUT  /api/authorization/:visitId/approve — approve and send to cashier
router.put('/:visitId/approve', approveAuthorization);

// PUT  /api/authorization/:visitId/reject  — reject and return to records
router.put('/:visitId/reject', rejectAuthorization);

module.exports = router;
