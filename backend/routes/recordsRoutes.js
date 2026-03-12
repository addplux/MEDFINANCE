const express = require('express');
const router = express.Router();
const recordsController = require('../controllers/recordsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', recordsController.getStats);
router.get('/requests', recordsController.getAllRequests);
router.post('/requests', recordsController.createRequest);
router.post('/requests/:id/fulfill', recordsController.fulfillRequest);

module.exports = router;
