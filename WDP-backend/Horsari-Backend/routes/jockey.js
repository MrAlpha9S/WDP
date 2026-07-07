const express = require('express');
const JockeyController = require('../controllers/JockeyController');
const { authMiddleware, authJockey, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/jockeySwagger');

// Public routes
router.get('/all', JockeyController.getAllJockeys);

// Mobile-compatible routes
router.get('/my-race-schedule', authMiddleware, authJockey, JockeyController.getMyRaceScheduleFlat);
router.get('/my-invitations', authMiddleware, authJockey, JockeyController.getMyInvitationsFlat);
router.put('/invitation/:invitationId/respond', authMiddleware, authJockey, JockeyController.respondToInvitationById);

module.exports = router;
