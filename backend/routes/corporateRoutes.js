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

// Add a single patient to a corporate scheme manually
router.post('/:accountId/members/add', authorize('admin', 'accountant', 'cashier'), corporateMemberController.addSingleMember);

// ── Corporate Self-Service Portal ──────────────────────────────────────────────
// Public: no authMiddleware — companies authenticate with their own credentials
router.post('/portal/login', corporateMemberController.portalLogin);
// Portal authenticated routes use a lighter token check inside the controller
router.get('/portal/account', corporateMemberController.portalAccount);
router.get('/portal/transactions', corporateMemberController.portalTransactions);

module.exports = router;
