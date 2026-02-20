const express = require('express');
const router = express.Router();
const { getPendingVettingClaims, vetClaim, createBatch, getBatches } = require('../controllers/nhimaController');
const { authMiddleware } = require('../middleware/auth');

// Claims Vetting
router.get('/vetting/pending', authMiddleware, getPendingVettingClaims);
router.put('/:id/vet', authMiddleware, vetClaim);

// Batching
router.post('/batches', authMiddleware, createBatch);
router.get('/batches', authMiddleware, getBatches);

module.exports = router;
