const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');
const { authMiddleware, authorize } = require('../middleware/auth');

// All setup routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize('admin'));

// Services/Tariffs
router.get('/services', setupController.getAllServices);
router.get('/services/:id', setupController.getService);
router.post('/services', setupController.createService);
router.put('/services/:id', setupController.updateService);
router.delete('/services/:id', setupController.deleteService);

// Users
router.get('/users', setupController.getAllUsers);
router.get('/users/:id', setupController.getUser);
router.post('/users', setupController.createUser);
router.put('/users/:id', setupController.updateUser);

// Departments
router.get('/departments', setupController.getAllDepartments);
router.get('/departments/:id', setupController.getDepartment);
router.post('/departments', setupController.createDepartment);
router.put('/departments/:id', setupController.updateDepartment);

// Organization Profile
router.get('/organization', setupController.getOrganization);
router.put('/organization', setupController.updateOrganization);

module.exports = router;
