const express = require('express');
const router = express.Router();
const theatreController = require('../controllers/theatreController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Theatre bill routes
router.post('/bills', theatreController.createTheatreBill);
router.get('/bills', theatreController.getAllTheatreBills);
router.get('/bills/:id', theatreController.getTheatreBillById);
router.put('/bills/:id', theatreController.updateTheatreBill);
router.delete('/bills/:id', theatreController.deleteTheatreBill);

// Revenue statistics
router.get('/revenue', theatreController.getTheatreRevenue);

module.exports = router;
