const express = require('express');
const RefereeController = require('../controllers/RefereeController');
const { authMiddleware, authReferee, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/refereeSwagger');

// Public routes
router.get('/all', RefereeController.getAllReferees);
router.get('/credentials/:certificationNumber', RefereeController.getRefereeByCredentials);
router.get('/license/:licenseNumber', RefereeController.getRefereeByLicense);

// Public - create referee profile for existing user
router.post('/:uid',RefereeController.createReferee);

// Protected routes - Referee only
router.get('/profile', authMiddleware, authReferee, RefereeController.getRefereeProfile);
router.put('/profile', authMiddleware, authReferee, RefereeController.updateRefereeProfile);
router.post('/verify-credentials', authMiddleware, authReferee, RefereeController.verifyRefereeCredentials);
router.post('/renew-certification', authMiddleware, authReferee, RefereeController.renewCertification);
router.get('/race-rounds', authMiddleware, authReferee, RefereeController.getRefereeRaceRounds);
router.get('/tournaments', authMiddleware, authReferee, RefereeController.getRefereeTournaments);
router.get('/invitations', authMiddleware, authReferee, RefereeController.getRefereeInvitations);
router.put('/invitations/:id/accept', authMiddleware, authReferee, RefereeController.acceptInvitation);
router.put('/invitations/:id/reject', authMiddleware, authReferee, RefereeController.rejectInvitation);

module.exports = router;
