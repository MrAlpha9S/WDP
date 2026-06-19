const express = require('express');
const JockeyController = require('../controllers/JockeyController');
const { authMiddleware, authJockey, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/jockeySwagger');

// Public routes
router.get('/top', JockeyController.getTopJockeys);
router.get('/all', JockeyController.getAllJockeys);
router.get('/status/:status', JockeyController.getJockeysByStatus);

// Public - create jockey profile for existing user
router.post('/:uid', JockeyController.createJockey);

// Protected routes - Jockey only
router.get('/profile', authMiddleware, authJockey, JockeyController.getProfileWithUser);
router.put('/profile', authMiddleware, authJockey, JockeyController.updateProfileWithUser);
router.post('/change-password', authMiddleware, authJockey, JockeyController.changePassword);
router.get('/my-stats', authMiddleware, authJockey, JockeyController.getMyStats);
router.get('/invitations', authMiddleware, authJockey, JockeyController.getMyInvitations);
router.post('/invitations/respond', authMiddleware, authJockey, JockeyController.respondToInvitation);
router.get('/race-schedule', authMiddleware, authJockey, JockeyController.getMyRaceSchedule);
router.get('/race-history', authMiddleware, authJockey, JockeyController.getMyRaceHistory);
router.post('/record-win', authMiddleware, authJockey, JockeyController.addWin);
router.post('/record-match', authMiddleware, authJockey, JockeyController.recordMatch);

module.exports = router;
