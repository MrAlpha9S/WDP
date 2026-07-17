const express = require('express');
const AdminController = require('../controllers/AdminController');
const PaymentController = require('../controllers/PaymentController');
const { authMiddleware, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/adminSwagger');

// Admin statistics
router.get('/statistics', authMiddleware, authAdmin, AdminController.getStatistics);
router.get('/statistics/overview', authMiddleware, authAdmin, AdminController.getSystemStatistics);

// Dashboard panels — each is a lightweight, independent endpoint (loaded in parallel by the frontend)
router.get('/statistics/dashboard/kpi',                   authMiddleware, authAdmin, AdminController.getDashboardKpi);
router.get('/statistics/dashboard/house-earnings',        authMiddleware, authAdmin, AdminController.getDashboardHouseEarnings);
router.get('/statistics/dashboard/top-performers',        authMiddleware, authAdmin, AdminController.getDashboardTopPerformers);
router.get('/statistics/dashboard/predictions',           authMiddleware, authAdmin, AdminController.getDashboardPredictions);
router.get('/statistics/dashboard/spectator-leaderboard', authMiddleware, authAdmin, AdminController.getDashboardSpectatorLeaderboard);

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

// Quick-assign shortcut (testing/demo) — auto-pick horse+jockey for registrations
// not yet approved/accepted, so the referee's real review has something to act on
router.post('/race-rounds/:id/quick-assign', authMiddleware, authAdmin, AdminController.quickAssignHorsesAndJockeys);

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

// --- Payment verification (admin pays horseOwner prize money / referee fee) ---
router.get('/payments', authMiddleware, authAdmin, PaymentController.listMyPayments);
// System-wide payment list (all race_prize/referee_fee/jockey_payout rows, any party)
router.get('/payments/all', authMiddleware, authAdmin, PaymentController.listAllPayments);
router.put('/payments/:paymentId/confirm-paid', authMiddleware, authAdmin, PaymentController.confirmPaid);

// --- Wallet ledger (parimutuel house-take deposits — auto-applied, no confirmation) ---
router.get('/ledger', authMiddleware, authAdmin, PaymentController.listMyLedger);
// System-wide wallet ledger (all reward/deposit/withdrawal/refund rows, any user — e.g. spectator prediction payouts)
router.get('/ledger/all', authMiddleware, authAdmin, PaymentController.listAllLedger);

module.exports = router;
