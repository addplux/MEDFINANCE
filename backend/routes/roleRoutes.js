const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All role routes require authentication and admin access
router.use(authMiddleware);
router.use(authorize('admin'));

router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;
