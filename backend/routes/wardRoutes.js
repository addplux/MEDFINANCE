const express = require('express');
const router = express.Router();
const wardController = require('../controllers/wardController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get all wards
router.get('/', wardController.getAllWards);

// Get available beds for a specific ward
router.get('/:wardId/beds/available', wardController.getAvailableBeds);

// Admin routes (optional for now, but good to have)
router.post('/', wardController.createWard);
router.post('/:wardId/beds', wardController.createBed);

module.exports = router;
