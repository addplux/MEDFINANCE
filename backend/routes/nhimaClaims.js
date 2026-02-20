const express = require('express');
const router = express.Router();
const { getPendingVettingClaims, vetClaim, createBatch, getBatches } = require('../controllers/nhimaController');
const { protect } = require('../middleware/authMiddleware');

// Claims Vetting
router.get('/vetting/pending', protect, getPendingVettingClaims);
router.put('/:id/vet', protect, vetClaim);

// Batching
router.post('/batches', protect, createBatch);
router.get('/batches', protect, getBatches);

module.exports = router;
