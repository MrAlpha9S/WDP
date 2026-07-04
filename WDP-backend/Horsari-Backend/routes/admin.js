const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authMiddleware, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/adminSwagger');

// Admin-only - create admin profile for existing user
router.get('/profile', authMiddleware, authAdmin, AdminController.getAdminProfile);
// Admin statistics
router.get('/statistics', authMiddleware, authAdmin, AdminController.getStatistics);
router.get('/users/all', authMiddleware, authAdmin, AdminController.getAllUsers);
router.get('/users/:userId', authMiddleware, authAdmin, AdminController.getUsersDetail);

router.put('/users/:userId/status', authMiddleware, authAdmin, AdminController.updateUserStatus);
router.patch('/users/:userId/certification', authMiddleware, authAdmin, AdminController.verifyCertification);
// admin level endpoints removed
router.delete('/users/:userId', authMiddleware, authAdmin, AdminController.deleteUser);

// Horse owner invitation list (enriched with race round, horse, jockeys, owner info)
router.get('/horse-owner-invitations', authMiddleware, authAdmin, AdminController.getHorseOwnerInvitations);

// Referee invitation list
router.get('/referee-invitations', authMiddleware, authAdmin, AdminController.getRefereeInvitations);

// Jockey invitation list
router.get('/jockey-invitations', authMiddleware, authAdmin, AdminController.getJockeyInvitations);

// Get tournaments with details and prediction pool
router.get('/tournaments', authMiddleware, authAdmin, AdminController.getTournamentsWithDetails);

// Set tournament champion and settle all champion predictions
router.post('/tournaments/:tournamentId/champion', authMiddleware, authAdmin, AdminController.setTournamentChampion);

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

// Live simulation snapshot
router.get('/race-rounds/:id/simulation', authMiddleware, authAdmin, AdminController.getSimulationState);

// All violations for a race (all referees combined)
router.get('/race-rounds/:id/violations', authMiddleware, authAdmin, AdminController.getRaceViolations);

// Soft-delete (dismiss) a violation
router.patch('/violations/:violationId/dismiss', authMiddleware, authAdmin, AdminController.dismissViolation);

// Confirm race results → mark official, close race (Moved to referee)

// Payments due — horse owner prize money / referee fees awaiting confirmation
router.get('/payments-due', authMiddleware, authAdmin, AdminController.getPaymentsDue);
router.post('/race-results/:id/confirm-payment', authMiddleware, authAdmin, AdminController.confirmOwnerPayment);
router.post('/race-referees/:id/confirm-payment', authMiddleware, authAdmin, AdminController.confirmRefereePayment);

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
router.get('/rules/:id', authMiddleware, authAdmin, AdminController.getRuleById);
router.post('/rules', authMiddleware, authAdmin, AdminController.createRule);
router.put('/rules/:id', authMiddleware, authAdmin, AdminController.updateRule);
router.delete('/rules/:id', authMiddleware, authAdmin, AdminController.deleteRule);

router.post('/:uid', authMiddleware, authAdmin, AdminController.createAdmin);

module.exports = router;
