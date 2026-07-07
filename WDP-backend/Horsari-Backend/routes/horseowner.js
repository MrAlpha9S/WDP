const express = require('express');
const HorseOwnerController = require('../controllers/HorseOwnerController');
const { authMiddleware, authHorseOwner, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/horseownerSwagger');
const RaceInvitationsController = require('../controllers/RaceInvitationsController');

// Protected routes - Horse owner only
router.get('/my-horses', authMiddleware, authHorseOwner, HorseOwnerController.getMyHorses);
// Race invitations for owner
router.get('/race-invitations', authMiddleware, authHorseOwner, RaceInvitationsController.getRaceInvitations);
router.post('/registration/:registrationId/approve', authMiddleware, authHorseOwner, RaceInvitationsController.approveRegistration);
// Jockey invitations sent by this horse owner
router.get('/invitations', authMiddleware, authHorseOwner, HorseOwnerController.getJockeyInvitations);
// Horse profile: aggregated registration history, race results, violations
router.get('/horses/:horseId/profile', authMiddleware, authHorseOwner, HorseOwnerController.getHorseProfile);
// Get race detail: own registration, jockey invitations, and horse result
router.get('/race-rounds/:raceRoundId/detail', authMiddleware, authHorseOwner, HorseOwnerController.getRaceDetail);

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
router.get('/financials/race-results', authMiddleware, authHorseOwner, HorseOwnerController.getFinancialRaceResults);

module.exports = router;
