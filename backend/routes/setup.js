const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Admin authorization is handled per-route where needed
// Default: all setup routes require authentication
router.use(authMiddleware);


// Services/Tariffs
router.get('/services', authorize('admin', 'doctor', 'nurse', 'lab_technician', 'radiographer', 'pharmacist'), setupController.getAllServices);
router.get('/services/:id', authorize('admin', 'doctor', 'nurse', 'lab_technician', 'radiographer', 'pharmacist'), setupController.getService);
router.post('/services', authorize('admin'), setupController.createService);
router.put('/services/:id', authorize('admin'), setupController.updateService);
router.delete('/services/:id', authorize('admin'), setupController.deleteService);

// Users
router.get('/users', authorize('admin'), setupController.getAllUsers);
router.get('/users/:id', authorize('admin'), setupController.getUser);
router.post('/users', authorize('admin'), setupController.createUser);
router.put('/users/:id', authorize('admin'), setupController.updateUser);

// Departments
router.get('/departments', authorize('admin'), setupController.getAllDepartments);
router.get('/departments/:id', authorize('admin'), setupController.getDepartment);
router.post('/departments', authorize('admin'), setupController.createDepartment);
router.put('/departments/:id', authorize('admin'), setupController.updateDepartment);

// Organization Profile
router.get('/organization', authorize('admin'), setupController.getOrganization);
router.put('/organization', authorize('admin'), setupController.updateOrganization);

module.exports = router;
