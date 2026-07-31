const express = require('express');
const HorseOwnerController = require('../controllers/HorseOwnerController');
const PaymentController = require('../controllers/PaymentController');
const { authMiddleware, authHorseOwner, authAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

require('../swagger/horseownerSwagger');
const RaceInvitationsController = require('../controllers/RaceInvitationsController');

// Self-service profile
router.get('/my-profile', authMiddleware, authHorseOwner, HorseOwnerController.getMyProfile);
router.put('/my-profile', authMiddleware, authHorseOwner, HorseOwnerController.updateMyProfile);
router.put('/my-profile/license', authMiddleware, authHorseOwner, upload.single('license'), HorseOwnerController.updateMyLicense);

// Protected routes - Horse owner only
router.get('/my-horses', authMiddleware, authHorseOwner, HorseOwnerController.getMyHorses);
// Race invitations for owner
router.get('/race-invitations', authMiddleware, authHorseOwner, RaceInvitationsController.getRaceInvitations);
router.post('/registration/:registrationId/accept', authMiddleware, authHorseOwner, RaceInvitationsController.acceptRegistration);
// Jockey invitations sent by this horse owner
router.get('/invitations', authMiddleware, authHorseOwner, HorseOwnerController.getJockeyInvitations);
// Horse profile: aggregated registration history, race results, violations
router.get('/horses/:horseId/profile', authMiddleware, authHorseOwner, HorseOwnerController.getHorseProfile);
// Get race detail: own registration, jockey invitations, and horse result
router.get('/race-rounds/:raceRoundId/detail', authMiddleware, authHorseOwner, HorseOwnerController.getRaceDetail);
// Lightweight race round status (cheap, poll-friendly)
router.get('/race-rounds/:raceRoundId/status', authMiddleware, authHorseOwner, HorseOwnerController.getRaceRoundStatus);

router.put('/horses/:horseId/status', authMiddleware, authHorseOwner, HorseOwnerController.updateHorseStatus);
router.put('/horses/:horseId/health-status', authMiddleware, authHorseOwner, HorseOwnerController.updateHorseHealthStatus);

router.get('/race-eligibility-metadata', authMiddleware, authHorseOwner, HorseOwnerController.getRaceEligibilityMetadata);

// Dashboard
router.get('/dashboard/summary',        authMiddleware, authHorseOwner, HorseOwnerController.getDashboardSummary);
router.get('/dashboard/top-performers', authMiddleware, authHorseOwner, HorseOwnerController.getTopPerformers);
router.get('/races/browse',             authMiddleware, authHorseOwner, HorseOwnerController.browseRaces);

// Jockey profile (race history + violations) visible to horse owners
router.get('/jockeys/:jockeyId/profile', authMiddleware, authHorseOwner, HorseOwnerController.getJockeyProfile);

// Financials
router.get('/financials/summary', authMiddleware, authHorseOwner, HorseOwnerController.getFinancialSummary);
router.get('/financials/earnings-series', authMiddleware, authHorseOwner, HorseOwnerController.getFinancialEarningsSeries);
router.get('/financials/race-results', authMiddleware, authHorseOwner, HorseOwnerController.getFinancialRaceResults);

// --- Payment verification ---
// horseOwner is the payee for race prize money, and the payer for jockey payouts
router.get('/payments', authMiddleware, authHorseOwner, PaymentController.listMyPayments);
router.put('/payments/:paymentId/confirm-received', authMiddleware, authHorseOwner, PaymentController.confirmReceived);
router.put('/payments/:paymentId/confirm-paid', authMiddleware, authHorseOwner, PaymentController.confirmPaid);

module.exports = router;
