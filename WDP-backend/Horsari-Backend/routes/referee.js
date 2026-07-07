const express = require('express');
const RefereeController = require('../controllers/RefereeController');
const { authMiddleware, authReferee, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/refereeSwagger');

// Protected routes - Referee only
router.get('/race-rounds', authMiddleware, authReferee, RefereeController.getRefereeRaceRounds);
router.get('/race-rounds/:id', authMiddleware, authReferee, RefereeController.getRaceRoundById);
router.get('/race-rounds/:id/violations', authMiddleware, authReferee, RefereeController.getRaceRoundViolations);
router.post('/race-rounds/:id/confirm-result', authMiddleware, authReferee, RefereeController.confirmRaceResult);
router.put('/race-rounds/:raceRoundId/registrations/:registrationId/verify', authMiddleware, authReferee, RefereeController.verifyRegistration);
router.put('/race-rounds/:raceRoundId/registrations/:registrationId/cancel', authMiddleware, authReferee, RefereeController.cancelRegistration);
router.post('/race-rounds/:id/finalize', authMiddleware, authReferee, RefereeController.finalizeRaceRound);
router.get('/tournaments', authMiddleware, authReferee, RefereeController.getRefereeTournaments);
router.get('/invitations', authMiddleware, authReferee, RefereeController.getRefereeInvitations);
router.put('/invitations/:id/accept', authMiddleware, authReferee, RefereeController.acceptInvitation);
router.put('/invitations/:id/reject', authMiddleware, authReferee, RefereeController.rejectInvitation);
router.get('/violation-types', authMiddleware, authReferee, RefereeController.getViolationTypes);
router.post('/violations', authMiddleware, authReferee, RefereeController.createViolation);
router.put('/violations/:violationId/confirm', authMiddleware, authReferee, RefereeController.confirmViolation);
router.delete('/violations/:violationId', authMiddleware, authReferee, RefereeController.deleteViolation);

module.exports = router;
