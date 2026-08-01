const express = require('express');
const RefereeController = require('../controllers/RefereeController');
const PaymentController = require('../controllers/PaymentController');
const { authMiddleware, authReferee, authAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

require('../swagger/refereeSwagger');

// Self-service profile
router.get('/my-profile', authMiddleware, authReferee, RefereeController.getMyProfile);
router.put('/my-profile', authMiddleware, authReferee, RefereeController.updateMyProfile);
router.put('/my-profile/license', authMiddleware, authReferee, upload.single('license'), RefereeController.updateMyLicense);

// Protected routes - Referee only
router.get('/race-rounds', authMiddleware, authReferee, RefereeController.getRefereeRaceRounds);
router.get('/race-rounds/:id', authMiddleware, authReferee, RefereeController.getRaceRoundById);
router.get('/race-rounds/:id/violations', authMiddleware, authReferee, RefereeController.getRaceRoundViolations);
router.post('/race-rounds/:id/confirm-result', authMiddleware, authReferee, RefereeController.confirmRaceResult);
router.put('/race-rounds/:raceRoundId/registrations/:registrationId/verify', authMiddleware, authReferee, RefereeController.verifyRegistration);
router.put('/race-rounds/:raceRoundId/registrations/:registrationId/cancel', authMiddleware, authReferee, RefereeController.cancelRegistration);
router.post('/race-rounds/:id/finalize', authMiddleware, authReferee, RefereeController.finalizeRaceRound);
router.get('/tournaments', authMiddleware, authReferee, RefereeController.getRefereeTournaments);
// Lightweight { _id, tournamentName } list for this referee's tournaments — for the
// Homepage filter dropdown / name lookup, without getRefereeTournaments's nested race-round data.
router.get('/tournaments/names', authMiddleware, authReferee, RefereeController.getTournamentNames);
router.get('/invitations', authMiddleware, authReferee, RefereeController.getRefereeInvitations);
router.put('/invitations/:id/accept', authMiddleware, authReferee, RefereeController.acceptInvitation);
router.put('/invitations/:id/reject', authMiddleware, authReferee, RefereeController.rejectInvitation);
router.put('/invitations/:invitationId/no-show', authMiddleware, authReferee, RefereeController.markJockeyNoShow);
router.put('/invitations/:invitationId/cancel-no-show', authMiddleware, authReferee, RefereeController.cancelJockeyNoShow);
router.get('/violation-types', authMiddleware, authReferee, RefereeController.getViolationTypes);
router.get('/violations', authMiddleware, authReferee, RefereeController.getAllViolations);
router.post('/violations', authMiddleware, authReferee, RefereeController.createViolation);
router.put('/violations/:violationId/confirm', authMiddleware, authReferee, RefereeController.confirmViolation);
router.delete('/violations/:violationId', authMiddleware, authReferee, RefereeController.deleteViolation);

// Wallet + payment verification
router.get('/wallet', authMiddleware, authReferee, RefereeController.getWalletInfo);
router.get('/statistics', authMiddleware, authReferee, RefereeController.getStatistics);
router.get('/statistics/earnings-series', authMiddleware, authReferee, RefereeController.getFeesEarningsSeries);
router.get('/work-history', authMiddleware, authReferee, RefereeController.getWorkHistory);
router.get('/payments', authMiddleware, authReferee, PaymentController.listMyPayments);
router.put('/payments/:paymentId/confirm-received', authMiddleware, authReferee, PaymentController.confirmReceived);

module.exports = router;
