const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/start', shiftController.startShift);
router.post('/end', shiftController.endShift);
router.get('/current', shiftController.getCurrentShift);
router.get('/reports', shiftController.getShiftReports);

module.exports = router;
