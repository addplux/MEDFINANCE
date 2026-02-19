/**
 * MEDFINANCE360 Auth Routes
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, authorize } = require('../middleware/auth');

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/info', authController.getOrganizationInfo);

// ── Protected routes ──────────────────────────────────────────────────────────
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authController.logout);

// ── Admin-only: pending user management ───────────────────────────────────────
router.get('/pending-users', authMiddleware, authorize('admin'), authController.getPendingUsers);
router.put('/approve/:id', authMiddleware, authorize('admin'), authController.approveUser);
router.put('/reject/:id', authMiddleware, authorize('admin'), authController.rejectUser);

module.exports = router;
