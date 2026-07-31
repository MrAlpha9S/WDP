const express = require('express');
const AdminProfileController = require('../controllers/admin/ProfileController');
const AdminStatisticsController = require('../controllers/admin/StatisticsController');
const AdminUserController = require('../controllers/admin/UserController');
const AdminInvitationController = require('../controllers/admin/InvitationController');
const AdminTournamentController = require('../controllers/admin/TournamentController');
const AdminRaceRoundController = require('../controllers/admin/RaceRoundController');
const AdminViolationController = require('../controllers/admin/ViolationController');
const AdminHorseController = require('../controllers/admin/HorseController');
const AdminRuleController = require('../controllers/admin/RuleController');
const PaymentController = require('../controllers/PaymentController');
const { authMiddleware, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/adminSwagger');

// Self-service profile (distinct from /users/:userId, which is admin managing others)
router.get('/my-profile', authMiddleware, authAdmin, AdminProfileController.getMyProfile);
router.put('/my-profile', authMiddleware, authAdmin, AdminProfileController.updateMyProfile);

// Admin statistics
router.get('/statistics', authMiddleware, authAdmin, AdminStatisticsController.getStatistics);
router.get('/statistics/overview', authMiddleware, authAdmin, AdminStatisticsController.getSystemStatistics);

// Dashboard panels — each is a lightweight, independent endpoint (loaded in parallel by the frontend)
router.get('/statistics/dashboard/kpi',                   authMiddleware, authAdmin, AdminStatisticsController.getDashboardKpi);
router.get('/statistics/dashboard/house-earnings',        authMiddleware, authAdmin, AdminStatisticsController.getDashboardHouseEarnings);
router.get('/statistics/dashboard/top-performers',        authMiddleware, authAdmin, AdminStatisticsController.getDashboardTopPerformers);
router.get('/statistics/dashboard/predictions',           authMiddleware, authAdmin, AdminStatisticsController.getDashboardPredictions);
router.get('/statistics/dashboard/spectator-leaderboard', authMiddleware, authAdmin, AdminStatisticsController.getDashboardSpectatorLeaderboard);

router.get('/users/all', authMiddleware, authAdmin, AdminUserController.getAllUsers);
router.get('/users/:userId', authMiddleware, authAdmin, AdminUserController.getUsersDetail);

// PDF proxy — serve a Cloudinary license URL inline with correct Content-Type
// Usage: GET /api/admin/proxy-license?url=<cloudinary_url>
router.get('/proxy-license', authMiddleware, authAdmin, AdminUserController.proxyLicense);

router.patch('/users/:userId/certification', authMiddleware, authAdmin, AdminUserController.verifyCertification);

// Horse owner invitation list (enriched with race round, horse, jockeys, owner info)
router.get('/horse-owner-invitations', authMiddleware, authAdmin, AdminInvitationController.getHorseOwnerInvitations);

// Referee invitation list
router.get('/referee-invitations', authMiddleware, authAdmin, AdminInvitationController.getRefereeInvitations);

// Jockey invitation list
router.get('/jockey-invitations', authMiddleware, authAdmin, AdminInvitationController.getJockeyInvitations);

// Create/update/delete a tournament
router.post('/tournaments', authMiddleware, authAdmin, AdminTournamentController.createTournament);
router.put('/tournaments/:id', authMiddleware, authAdmin, AdminTournamentController.updateTournament);
router.delete('/tournaments/:id', authMiddleware, authAdmin, AdminTournamentController.deleteTournament);

// Get tournaments with details and prediction pool
router.get('/tournaments', authMiddleware, authAdmin, AdminTournamentController.getTournamentsWithDetails);

// Tournament counts by status (live/upcoming/completed), unaffected by pagination/search
router.get('/tournaments/stats', authMiddleware, authAdmin, AdminTournamentController.getTournamentStats);

// Lightweight { _id, tournamentName } list for EVERY tournament, including the
// "Non-tournament" placeholder that getTournamentsWithDetails/getTournamentStats
// deliberately hide — for resolving a race round's tournament name correctly
// instead of falling back to "Unknown Tournament".
router.get('/tournaments/names', authMiddleware, authAdmin, AdminTournamentController.getTournamentNames);

// Update a tournament's status — blocks completion while rounds are unfinished,
// cascade-cancels rounds on cancellation
router.patch('/tournaments/:id/status', authMiddleware, authAdmin, AdminTournamentController.updateTournamentStatus);

// Tournament detail: basic info + race rounds + auto-complete if end date passed
router.get('/tournaments/:id/detail', authMiddleware, authAdmin, AdminTournamentController.getTournamentDetail);

// Tournament ranking: horses ranked by cumulative score from official race results
router.get('/tournaments/:id/ranking', authMiddleware, authAdmin, AdminTournamentController.getTournamentRanking);

// All violations across every race (paginated, filterable by status/severity/raceRoundId)
router.get('/violations', authMiddleware, authAdmin, AdminViolationController.getAllViolations);
router.patch('/violations/:id/dismiss', authMiddleware, authAdmin, AdminViolationController.dismissViolation);

// ViolationType CRUD
router.get('/violation-types',                 authMiddleware, authAdmin, AdminViolationController.getAllViolationTypes);
router.post('/violation-types',                authMiddleware, authAdmin, AdminViolationController.createViolationType);
router.put('/violation-types/:id',             authMiddleware, authAdmin, AdminViolationController.updateViolationType);
router.patch('/violation-types/:id/active',    authMiddleware, authAdmin, AdminViolationController.toggleViolationTypeActive);

// Create/update/cancel a race round
router.post('/race-rounds', authMiddleware, authAdmin, AdminRaceRoundController.createRaceRound);
router.put('/race-rounds/:id', authMiddleware, authAdmin, AdminRaceRoundController.updateRaceRound);
router.patch('/race-rounds/:id/cancel', authMiddleware, authAdmin, AdminRaceRoundController.cancelRaceRound);

// Get race rounds grouped by tournament with deep nested entities
router.get('/race-rounds', authMiddleware, authAdmin, AdminRaceRoundController.getRaceRounds);

// Distinct race types (for the race-type filter dropdown) — ?isActive=true|false to narrow, omitted = all
router.get('/race-rounds/race-types', authMiddleware, authAdmin, AdminRaceRoundController.getRaceTypes);

// Distinct calendar days with matching race rounds — the schedule Timeline view's day-navigation list
router.get('/race-rounds/dates', authMiddleware, authAdmin, AdminRaceRoundController.getRaceRoundDates);

// Get race round details
router.get('/race-rounds/:id/detail', authMiddleware, authAdmin, AdminRaceRoundController.getRaceRoundDetail);
// Admin starts or cancels a prepared race round
router.put('/race-rounds/:id/status', authMiddleware, authAdmin, AdminRaceRoundController.setRaceRoundStatus);

// Quick-assign shortcut (testing/demo) — auto-pick horse+jockey for registrations
// not yet approved/accepted, so the referee's real review has something to act on
router.post('/race-rounds/:id/quick-assign', authMiddleware, authAdmin, AdminRaceRoundController.quickAssignHorsesAndJockeys);

// Provision a Mux live stream (must be done before starting the race)
router.post('/race-rounds/:id/stream', authMiddleware, authAdmin, AdminRaceRoundController.createStream);
// Mux live stream info (RTMP URL + stream key for OBS operator)
router.get('/race-rounds/:id/stream', authMiddleware, authAdmin, AdminRaceRoundController.getStreamInfo);

// Mux VOD playback ID (available after stream ends and Mux processes the recording)
router.get('/race-rounds/:id/vod', authMiddleware, authAdmin, AdminRaceRoundController.getVOD);

// Important events dashboard feed
router.get('/important-events', authMiddleware, authAdmin, AdminStatisticsController.getImportantEvents);

// Get all metadata required for creating a race
router.get('/create-race-metadata', authMiddleware, authAdmin, AdminRaceRoundController.getCreateRaceMetadata);

// --- Horse Management Routes ---
router.get('/horses',                   authMiddleware, authAdmin, AdminHorseController.getAllHorses);
router.get('/horses/:horseId',          authMiddleware, authAdmin, AdminHorseController.getHorseDetail);
router.patch('/horses/:horseId/status', authMiddleware, authAdmin, AdminHorseController.updateHorseStatus);

// --- Race Eligibility Rule Routes ---
router.get('/rules', authMiddleware, authAdmin, AdminRuleController.getAllRules);
router.post('/rules', authMiddleware, authAdmin, AdminRuleController.createRule);
router.put('/rules/:id', authMiddleware, authAdmin, AdminRuleController.updateRule);
router.delete('/rules/:id', authMiddleware, authAdmin, AdminRuleController.deleteRule);

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
