const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authMiddleware, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/adminSwagger');

// Admin statistics
router.get('/statistics', authMiddleware, authAdmin, AdminController.getStatistics);
router.get('/users/all', authMiddleware, authAdmin, AdminController.getAllUsers);
router.get('/users/:userId', authMiddleware, authAdmin, AdminController.getUsersDetail);

// PDF proxy — serve a Cloudinary license URL inline with correct Content-Type
// Usage: GET /api/admin/proxy-license?url=<cloudinary_url>
router.get('/proxy-license', authMiddleware, authAdmin, AdminController.proxyLicense);

router.patch('/users/:userId/certification', authMiddleware, authAdmin, AdminController.verifyCertification);

// Horse owner invitation list (enriched with race round, horse, jockeys, owner info)
router.get('/horse-owner-invitations', authMiddleware, authAdmin, AdminController.getHorseOwnerInvitations);

// Referee invitation list
router.get('/referee-invitations', authMiddleware, authAdmin, AdminController.getRefereeInvitations);

// Jockey invitation list
router.get('/jockey-invitations', authMiddleware, authAdmin, AdminController.getJockeyInvitations);

// Get tournaments with details and prediction pool
router.get('/tournaments', authMiddleware, authAdmin, AdminController.getTournamentsWithDetails);

// Tournament detail: basic info + race rounds + auto-complete if end date passed
router.get('/tournaments/:id/detail', authMiddleware, authAdmin, AdminController.getTournamentDetail);

// Tournament ranking: horses ranked by cumulative score from official race results
router.get('/tournaments/:id/ranking', authMiddleware, authAdmin, AdminController.getTournamentRanking);

// All violations across every race (paginated, filterable by status/severity/raceRoundId)
router.get('/violations', authMiddleware, authAdmin, AdminController.getAllViolations);

// ViolationType CRUD
router.get('/violation-types',                 authMiddleware, authAdmin, AdminController.getAllViolationTypes);
router.post('/violation-types',                authMiddleware, authAdmin, AdminController.createViolationType);
router.put('/violation-types/:id',             authMiddleware, authAdmin, AdminController.updateViolationType);
router.patch('/violation-types/:id/active',    authMiddleware, authAdmin, AdminController.toggleViolationTypeActive);

// Get race rounds grouped by tournament with deep nested entities
router.get('/race-rounds', authMiddleware, authAdmin, AdminController.getRaceRounds);

// Get race round details
router.get('/race-rounds/:id/detail', authMiddleware, authAdmin, AdminController.getRaceRoundDetail);
// Admin starts or cancels a prepared race round
router.put('/race-rounds/:id/status', authMiddleware, authAdmin, AdminController.setRaceRoundStatus);

// Provision a Mux live stream (must be done before starting the race)
router.post('/race-rounds/:id/stream', authMiddleware, authAdmin, AdminController.createStream);
// Mux live stream info (RTMP URL + stream key for OBS operator)
router.get('/race-rounds/:id/stream', authMiddleware, authAdmin, AdminController.getStreamInfo);

// Mux VOD playback ID (available after stream ends and Mux processes the recording)
router.get('/race-rounds/:id/vod', authMiddleware, authAdmin, AdminController.getVOD);

// Important events dashboard feed
router.get('/important-events', authMiddleware, authAdmin, AdminController.getImportantEvents);

// Get all metadata required for creating a race
router.get('/create-race-metadata', authMiddleware, authAdmin, AdminController.getCreateRaceMetadata);

// --- Horse Management Routes ---
router.get('/horses',                   authMiddleware, authAdmin, AdminController.getAllHorses);
router.get('/horses/:horseId',          authMiddleware, authAdmin, AdminController.getHorseDetail);
router.patch('/horses/:horseId/status', authMiddleware, authAdmin, AdminController.updateHorseStatus);

// --- Race Eligibility Rule Routes ---
router.get('/rules', authMiddleware, authAdmin, AdminController.getAllRules);
router.post('/rules', authMiddleware, authAdmin, AdminController.createRule);
router.put('/rules/:id', authMiddleware, authAdmin, AdminController.updateRule);
router.delete('/rules/:id', authMiddleware, authAdmin, AdminController.deleteRule);

module.exports = router;
