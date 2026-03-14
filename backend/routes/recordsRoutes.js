const express = require('express');
const router = express.Router();
const recordsController = require('../controllers/recordsController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/stats', recordsController.getStats);
router.get('/requests', recordsController.getAllRequests);
router.get('/activity', recordsController.getActivityLog);
router.post('/requests', recordsController.createRequest);
router.post('/requests/:id/fulfill', recordsController.fulfillRequest);

module.exports = router;
