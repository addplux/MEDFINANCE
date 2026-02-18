/**
 * MEDFINANCE360 Sync Routes
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { processBatch } = require('../controllers/syncController');

// POST /api/sync/batch — process batched offline requests
router.post('/batch', authMiddleware, processBatch);

module.exports = router;
