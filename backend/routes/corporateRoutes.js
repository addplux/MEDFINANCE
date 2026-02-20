const express = require('express');
const router = express.Router();
const corporateMemberController = require('../controllers/corporateMemberController');
const { authMiddleware, authorize } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All corporate member routes require authentication
router.use(authMiddleware);

// Get members for a specific corporate account
router.get('/:accountId/members', corporateMemberController.getCorporateMembers);

// Upload Excel file for bulk member registration
router.post('/:accountId/members/upload', authorize('admin', 'accountant'), upload.single('file'), corporateMemberController.uploadMembers);

// Update member status (activate/suspend)
router.put('/:accountId/members/:id/status', authorize('admin', 'accountant'), corporateMemberController.updateMemberStatus);

module.exports = router;
