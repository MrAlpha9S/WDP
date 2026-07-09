const express = require('express');
const JockeyController = require('../controllers/JockeyController');
const PaymentController = require('../controllers/PaymentController');
const { authMiddleware, authJockey, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/jockeySwagger');

// Public routes
router.get('/all', JockeyController.getAllJockeys);

// Mobile-compatible routes
router.get('/my-race-schedule', authMiddleware, authJockey, JockeyController.getMyRaceScheduleFlat);
router.get('/my-invitations', authMiddleware, authJockey, JockeyController.getMyInvitationsFlat);
router.put('/invitation/:invitationId/respond', authMiddleware, authJockey, JockeyController.respondToInvitationById);

// Wallet + payment verification
router.get('/wallet', authMiddleware, authJockey, JockeyController.getWalletInfo);
router.get('/payments', authMiddleware, authJockey, PaymentController.listMyPayments);
router.put('/payments/:paymentId/confirm-received', authMiddleware, authJockey, PaymentController.confirmReceived);

module.exports = router;
