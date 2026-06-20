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
router.get('/profile', authMiddleware, authJockey, JockeyController.getJockeyProfile);
router.put('/profile', authMiddleware, authJockey, JockeyController.updateJockeyProfile);
router.put('/change-password', authMiddleware, authJockey, JockeyController.changePassword);
router.get('/my-stats', authMiddleware, authJockey, JockeyController.getMyStats);
router.get('/my-invitations', authMiddleware, authJockey, JockeyController.getMyInvitations);
router.put('/invitation/:invitationId/respond', authMiddleware, authJockey, JockeyController.respondInvitation);
router.get('/my-race-schedule', authMiddleware, authJockey, JockeyController.getMyRaceSchedule);
router.get('/my-race-history', authMiddleware, authJockey, JockeyController.getMyRaceHistory);
router.post('/record-win', authMiddleware, authJockey, JockeyController.addWin);
router.post('/record-match', authMiddleware, authJockey, JockeyController.recordMatch);

module.exports = router;
