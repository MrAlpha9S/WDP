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

// Horse owner invitation list (enriched with race round, horse, jockeys, owner info)
router.get('/horse-owner-invitations', authMiddleware, authAdmin, AdminController.getHorseOwnerInvitations);

// Referee invitation list
router.get('/referee-invitations', authMiddleware, authAdmin, AdminController.getRefereeInvitations);

// Jockey invitation list
router.get('/jockey-invitations', authMiddleware, authAdmin, AdminController.getJockeyInvitations);

// Get tournaments with details and prediction pool
router.get('/tournaments', authMiddleware, authAdmin, AdminController.getTournamentsWithDetails);

// Get race rounds grouped by tournament with deep nested entities
router.get('/race-rounds', authMiddleware, authAdmin, AdminController.getRaceRounds);

// Get all metadata required for creating a race
router.get('/create-race-metadata', authMiddleware, authAdmin, AdminController.getCreateRaceMetadata);

module.exports = router;
