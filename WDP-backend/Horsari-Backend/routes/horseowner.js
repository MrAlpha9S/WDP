const express = require('express');
const HorseOwnerProfileController = require('../controllers/horseowner/ProfileController');
const HorseOwnerHorseController = require('../controllers/horseowner/HorseController');
const HorseOwnerRaceController = require('../controllers/horseowner/RaceController');
const HorseOwnerJockeyController = require('../controllers/horseowner/JockeyController');
const HorseOwnerDashboardController = require('../controllers/horseowner/DashboardController');
const HorseOwnerFinancialController = require('../controllers/horseowner/FinancialController');
const HorseOwnerInvitationController = require('../controllers/horseowner/InvitationController');
const PaymentController = require('../controllers/PaymentController');
const { authMiddleware, authHorseOwner, authAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { upload: imageUpload } = require('../utils/CloudinaryUtil');

const router = express.Router();

require('../swagger/horseownerSwagger');

// Self-service profile
router.get('/my-profile', authMiddleware, authHorseOwner, HorseOwnerProfileController.getMyProfile);
router.put('/my-profile', authMiddleware, authHorseOwner, HorseOwnerProfileController.updateMyProfile);
router.put('/my-profile/license', authMiddleware, authHorseOwner, upload.single('license'), HorseOwnerProfileController.updateMyLicense);

// Protected routes - Horse owner only
router.get('/my-horses', authMiddleware, authHorseOwner, HorseOwnerHorseController.getMyHorses);
// Race invitations for owner
router.get('/race-invitations', authMiddleware, authHorseOwner, HorseOwnerInvitationController.getRaceInvitations);
router.post('/registration/:registrationId/accept', authMiddleware, authHorseOwner, HorseOwnerInvitationController.acceptRegistration);
// Jockey invitations sent by this horse owner
router.get('/invitations', authMiddleware, authHorseOwner, HorseOwnerInvitationController.getJockeyInvitations);
router.post('/invitations', authMiddleware, authHorseOwner, HorseOwnerInvitationController.createInvitation);

// Horse CRUD
router.post('/horses', authMiddleware, authHorseOwner, HorseOwnerHorseController.createHorse);
router.put('/horses/:id', authMiddleware, authHorseOwner, HorseOwnerHorseController.updateHorse);
router.delete('/horses/:id', authMiddleware, authHorseOwner, HorseOwnerHorseController.deleteHorse);
router.post('/horses/:horseId/upload-image', authMiddleware, authHorseOwner, imageUpload.single('image'), HorseOwnerHorseController.uploadHorseImage);
// Horse profile: aggregated registration history, race results, violations
router.get('/horses/:horseId/profile', authMiddleware, authHorseOwner, HorseOwnerHorseController.getHorseProfile);
// Get race detail: own registration, jockey invitations, and horse result
router.get('/race-rounds/:raceRoundId/detail', authMiddleware, authHorseOwner, HorseOwnerRaceController.getRaceDetail);
// Lightweight race round status (cheap, poll-friendly)
router.get('/race-rounds/:raceRoundId/status', authMiddleware, authHorseOwner, HorseOwnerRaceController.getRaceRoundStatus);

router.put('/horses/:horseId/status', authMiddleware, authHorseOwner, HorseOwnerHorseController.updateHorseStatus);
router.put('/horses/:horseId/health-status', authMiddleware, authHorseOwner, HorseOwnerHorseController.updateHorseHealthStatus);

router.get('/race-eligibility-metadata', authMiddleware, authHorseOwner, HorseOwnerHorseController.getRaceEligibilityMetadata);

// Dashboard
router.get('/dashboard/summary',        authMiddleware, authHorseOwner, HorseOwnerDashboardController.getDashboardSummary);
router.get('/dashboard/top-performers', authMiddleware, authHorseOwner, HorseOwnerDashboardController.getTopPerformers);
router.get('/races/browse',             authMiddleware, authHorseOwner, HorseOwnerRaceController.browseRaces);

// Jockey profile (race history + violations) visible to horse owners
router.get('/jockeys/:jockeyId/profile', authMiddleware, authHorseOwner, HorseOwnerJockeyController.getJockeyProfile);

// Financials
router.get('/financials/summary', authMiddleware, authHorseOwner, HorseOwnerFinancialController.getFinancialSummary);
router.get('/financials/earnings-series', authMiddleware, authHorseOwner, HorseOwnerFinancialController.getFinancialEarningsSeries);
router.get('/financials/race-results', authMiddleware, authHorseOwner, HorseOwnerFinancialController.getFinancialRaceResults);

// --- Payment verification ---
// horseOwner is the payee for race prize money, and the payer for jockey payouts
router.get('/payments', authMiddleware, authHorseOwner, PaymentController.listMyPayments);
router.put('/payments/:paymentId/confirm-received', authMiddleware, authHorseOwner, PaymentController.confirmReceived);
router.put('/payments/:paymentId/confirm-paid', authMiddleware, authHorseOwner, PaymentController.confirmPaid);

module.exports = router;
