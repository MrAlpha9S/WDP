const express = require('express');
const RefereeProfileController = require('../controllers/referee/ProfileController');
const RefereeInvitationController = require('../controllers/referee/InvitationController');
const RefereeRaceRoundController = require('../controllers/referee/RaceRoundController');
const RefereeTournamentController = require('../controllers/referee/TournamentController');
const RefereeViolationController = require('../controllers/referee/ViolationController');
const RefereeStatisticsController = require('../controllers/referee/StatisticsController');
const PaymentController = require('../controllers/PaymentController');
const RaceEligibilityRuleController = require('../controllers/RaceEligibilityRuleController');
const { authMiddleware, authReferee, authAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

require('../swagger/refereeSwagger');

// Self-service profile
router.get('/my-profile', authMiddleware, authReferee, RefereeProfileController.getMyProfile);
router.put('/my-profile', authMiddleware, authReferee, RefereeProfileController.updateMyProfile);
router.put('/my-profile/license', authMiddleware, authReferee, upload.single('license'), RefereeProfileController.updateMyLicense);

// Protected routes - Referee only
router.get('/race-rounds', authMiddleware, authReferee, RefereeRaceRoundController.getRefereeRaceRounds);
router.get('/race-rounds/:id', authMiddleware, authReferee, RefereeRaceRoundController.getRaceRoundById);
router.get('/race-rounds/:id/violations', authMiddleware, authReferee, RefereeViolationController.getRaceRoundViolations);
router.post('/race-rounds/:id/confirm-result', authMiddleware, authReferee, RefereeRaceRoundController.confirmRaceResult);
router.put('/race-rounds/:raceRoundId/registrations/:registrationId/verify', authMiddleware, authReferee, RefereeRaceRoundController.verifyRegistration);
router.put('/race-rounds/:raceRoundId/registrations/:registrationId/cancel', authMiddleware, authReferee, RefereeRaceRoundController.cancelRegistration);
router.post('/race-rounds/:id/finalize', authMiddleware, authReferee, RefereeRaceRoundController.finalizeRaceRound);
router.get('/tournaments', authMiddleware, authReferee, RefereeTournamentController.getRefereeTournaments);
// Lightweight { _id, tournamentName } list for this referee's tournaments — for the
// Homepage filter dropdown / name lookup, without getRefereeTournaments's nested race-round data.
router.get('/tournaments/names', authMiddleware, authReferee, RefereeTournamentController.getTournamentNames);
router.get('/invitations', authMiddleware, authReferee, RefereeInvitationController.getRefereeInvitations);
router.put('/invitations/:id/accept', authMiddleware, authReferee, RefereeInvitationController.acceptInvitation);
router.put('/invitations/:id/reject', authMiddleware, authReferee, RefereeInvitationController.rejectInvitation);
router.put('/invitations/:invitationId/no-show', authMiddleware, authReferee, RefereeInvitationController.markJockeyNoShow);
router.get('/violation-types', authMiddleware, authReferee, RefereeViolationController.getViolationTypes);
router.get('/eligibility-rules', authMiddleware, authReferee, RaceEligibilityRuleController.getActiveRules);
router.get('/violations', authMiddleware, authReferee, RefereeViolationController.getAllViolations);
router.post('/violations', authMiddleware, authReferee, RefereeViolationController.createViolation);
router.put('/violations/:violationId/confirm', authMiddleware, authReferee, RefereeViolationController.confirmViolation);
router.delete('/violations/:violationId', authMiddleware, authReferee, RefereeViolationController.deleteViolation);

// Wallet + payment verification
router.get('/wallet', authMiddleware, authReferee, RefereeStatisticsController.getWalletInfo);
router.get('/statistics', authMiddleware, authReferee, RefereeStatisticsController.getStatistics);
router.get('/statistics/earnings-series', authMiddleware, authReferee, RefereeStatisticsController.getFeesEarningsSeries);
router.get('/work-history', authMiddleware, authReferee, RefereeStatisticsController.getWorkHistory);
router.get('/payments', authMiddleware, authReferee, PaymentController.listMyPayments);
router.put('/payments/:paymentId/confirm-received', authMiddleware, authReferee, PaymentController.confirmReceived);

module.exports = router;
