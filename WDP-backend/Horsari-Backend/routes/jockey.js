const express = require('express');
const JockeyProfileController = require('../controllers/jockey/ProfileController');
const JockeyInvitationController = require('../controllers/jockey/InvitationController');
const JockeyRaceController = require('../controllers/jockey/RaceController');
const JockeyStatisticsController = require('../controllers/jockey/StatisticsController');
const PaymentController = require('../controllers/PaymentController');
const { authMiddleware, authJockey, authAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

require('../swagger/jockeySwagger');

// Public routes
router.get('/all', JockeyProfileController.getAllJockeys);

// Mobile-compatible routes
router.get('/my-race-schedule', authMiddleware, authJockey, JockeyRaceController.getMyRaceScheduleFlat);
router.get('/my-invitations', authMiddleware, authJockey, JockeyInvitationController.getMyInvitationsFlat);
router.put('/invitation/:invitationId/respond', authMiddleware, authJockey, JockeyInvitationController.respondToInvitationById);
router.get('/my-profile', authMiddleware, authJockey, JockeyProfileController.getMyProfile);
router.put('/my-profile', authMiddleware, authJockey, JockeyProfileController.updateMyProfile);
router.put('/my-profile/license', authMiddleware, authJockey, upload.single('license'), JockeyProfileController.updateMyLicense);
router.get('/all-races', authMiddleware, authJockey, JockeyRaceController.getAllRaces);

// Wallet + payment verification
router.get('/wallet', authMiddleware, authJockey, JockeyStatisticsController.getWalletInfo);
router.get('/statistics', authMiddleware, authJockey, JockeyStatisticsController.getStatistics);
router.get('/statistics/earnings-series', authMiddleware, authJockey, JockeyStatisticsController.getEarningsSeries);
router.get('/payments', authMiddleware, authJockey, PaymentController.listMyPayments);
router.put('/payments/:paymentId/confirm-received', authMiddleware, authJockey, PaymentController.confirmReceived);

module.exports = router;
