const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All asset routes require authentication
router.use(authMiddleware);

router.get('/', assetController.getAllAssets);
router.get('/summary', assetController.getAssetSummary);
router.get('/:id', assetController.getAsset);
router.get('/:id/depreciation', assetController.getDepreciationSchedule);
router.post('/', authorize('admin', 'accountant'), assetController.createAsset);
router.put('/:id', authorize('admin', 'accountant'), assetController.updateAsset);
router.delete('/:id', authorize('admin'), assetController.deleteAsset);

module.exports = router;
