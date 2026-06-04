const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authMiddleware, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/adminSwagger');

// Admin-only - create admin profile for existing user
router.post('/:uid', authMiddleware, authAdmin, AdminController.createAdmin);
router.get('/profile', authMiddleware, authAdmin, AdminController.getAdminProfile);
// Admin statistics
router.get('/statistics', authMiddleware, authAdmin, AdminController.getStatistics);
router.get('/users/all', authMiddleware, authAdmin, AdminController.getAllUsers);
router.get('/users/role/:role', authMiddleware, authAdmin, AdminController.getUsersByRole);
router.put('/users/:userId/status', authMiddleware, authAdmin, AdminController.updateUserStatus);
// admin level endpoints removed
router.delete('/users/:userId', authMiddleware, authAdmin, AdminController.deleteUser);

module.exports = router;
