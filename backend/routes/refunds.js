const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/request', refundController.requestRefund);
router.put('/:id/approve', refundController.approveRefund);
router.put('/:id/reject', refundController.rejectRefund);
router.get('/', refundController.getRefunds);

module.exports = router;
