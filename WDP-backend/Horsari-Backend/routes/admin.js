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

// Mux live stream info (RTMP URL + stream key for OBS operator)
router.get('/race-rounds/:id/stream', authMiddleware, authAdmin, AdminController.getStreamInfo);

// Mux VOD playback ID (available after stream ends and Mux processes the recording)
router.get('/race-rounds/:id/vod', authMiddleware, authAdmin, AdminController.getVOD);

// Important events dashboard feed
router.get('/important-events', authMiddleware, authAdmin, AdminController.getImportantEvents);

// Get all metadata required for creating a race
router.get('/create-race-metadata', authMiddleware, authAdmin, AdminController.getCreateRaceMetadata);

// --- Race Eligibility Rule Routes ---
router.get('/rules', authMiddleware, authAdmin, AdminController.getAllRules);
router.get('/rules/:id', authMiddleware, authAdmin, AdminController.getRuleById);
router.post('/rules', authMiddleware, authAdmin, AdminController.createRule);
router.put('/rules/:id', authMiddleware, authAdmin, AdminController.updateRule);
router.delete('/rules/:id', authMiddleware, authAdmin, AdminController.deleteRule);

router.post('/:uid', authMiddleware, authAdmin, AdminController.createAdmin);

module.exports = router;
