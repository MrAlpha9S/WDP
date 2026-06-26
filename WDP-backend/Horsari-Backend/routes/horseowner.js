const express = require('express');
const HorseOwnerController = require('../controllers/HorseOwnerController');
const { authMiddleware, authHorseOwner, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/horseownerSwagger');
const RaceInvitationsController = require('../controllers/RaceInvitationsController');

// Public routes
router.get('/all', authMiddleware, authAdmin, HorseOwnerController.getAllHorseOwners);
router.get('/license/:licenseNumber', authMiddleware, authHorseOwner, HorseOwnerController.getHorseOwnerByLicense);

// Public - create horse owner profile for existing user
router.post('/:uid', HorseOwnerController.createHorseOwner);

// Protected routes - Horse owner only
router.get('/profile', authMiddleware, authHorseOwner, HorseOwnerController.getHorseOwnerProfile);
router.put('/profile', authMiddleware, authHorseOwner, HorseOwnerController.updateHorseOwnerProfile);
router.get('/my-horses', authMiddleware, authHorseOwner, HorseOwnerController.getMyHorses);
router.get('/my-horses/stats', authMiddleware, authHorseOwner, HorseOwnerController.getMyHorsesStats);
router.get('/my-horses/health/:healthStatus', authMiddleware, authHorseOwner, HorseOwnerController.getHorsesByHealthStatus);
// Race invitations for owner
router.get('/race-invitations', authMiddleware, authHorseOwner, RaceInvitationsController.getRaceInvitations);
router.post('/registration/:registrationId/approve', authMiddleware, authHorseOwner, RaceInvitationsController.approveRegistration);
router.post('/registration/:registrationId/reject', authMiddleware, authHorseOwner, RaceInvitationsController.rejectRegistration);
// Horse owner can view all jockeys
router.get('/jockeys', authMiddleware, authHorseOwner, HorseOwnerController.getAllJockeys);
// Jockey invitations sent by this horse owner
router.get('/invitations', authMiddleware, authHorseOwner, HorseOwnerController.getJockeyInvitations);
// Horse profile: aggregated registration history, race results, violations
router.get('/horses/:horseId/profile', authMiddleware, authHorseOwner, HorseOwnerController.getHorseProfile);
// Confirm race start after referee has reviewed all registrations
router.post('/race-rounds/:raceRoundId/confirm-start', authMiddleware, authHorseOwner, HorseOwnerController.confirmRaceStart);
// Get race detail: own registration, jockey invitations, and horse result
router.get('/race-rounds/:raceRoundId/detail', authMiddleware, authHorseOwner, HorseOwnerController.getRaceDetail);

router.put('/horses/:horseId/status', authMiddleware, authHorseOwner, HorseOwnerController.updateHorseStatus);
router.put('/horses/:horseId/health-status', authMiddleware, authHorseOwner, HorseOwnerController.updateHorseHealthStatus);


module.exports = router;
