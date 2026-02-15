const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All setup routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize('admin'));

// Services/Tariffs
router.get('/services', setupController.getAllServices);
router.post('/services', setupController.createService);
router.put('/services/:id', setupController.updateService);
router.delete('/services/:id', setupController.deleteService);

// Users
router.get('/users', setupController.getAllUsers);
router.post('/users', setupController.createUser);
router.put('/users/:id', setupController.updateUser);

// Departments
router.get('/departments', setupController.getAllDepartments);
router.post('/departments', setupController.createDepartment);
router.put('/departments/:id', setupController.updateDepartment);

module.exports = router;
