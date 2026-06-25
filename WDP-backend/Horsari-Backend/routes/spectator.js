const express = require('express');
const SpectatorController = require('../controllers/SpectatorController');
const { authMiddleware, authSpectator } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/spectatorSwagger');

// Public routes (specific paths before wildcard)
router.get('/top', SpectatorController.getTopSpectators);
router.get('/all', SpectatorController.getAllSpectators);

// Protected routes - profile
router.get('/profile', authMiddleware, authSpectator, SpectatorController.getSpectatorProfile);
router.put('/profile', authMiddleware, authSpectator, SpectatorController.updateSpectatorProfile);

// Protected routes - auth
router.post('/change-password', authMiddleware, authSpectator, SpectatorController.changePassword);

// Protected routes - rewards (legacy)
router.get('/rewards', authMiddleware, authSpectator, SpectatorController.getRewardPoints);
router.post('/rewards/add', authMiddleware, authSpectator, SpectatorController.addRewardPoints);
router.post('/rewards/deduct', authMiddleware, authSpectator, SpectatorController.deductRewardPoints);

// Protected routes - wallet
router.get('/wallet', authMiddleware, authSpectator, SpectatorController.getWalletInfo);
router.get('/transactions', authMiddleware, authSpectator, SpectatorController.getTransactionHistory);
router.post('/deposit', authMiddleware, authSpectator, SpectatorController.depositPoints);
router.post('/withdraw', authMiddleware, authSpectator, SpectatorController.withdrawPoints);
// Mobile-compatible aliases
router.post('/transactions/deposit', authMiddleware, authSpectator, SpectatorController.depositPoints);
router.post('/transactions/withdraw', authMiddleware, authSpectator, SpectatorController.withdrawPoints);

// Protected routes - home feed & race viewing
router.get('/home-feed', authMiddleware, authSpectator, SpectatorController.getHomeFeed);
router.get('/race-schedule', authMiddleware, authSpectator, SpectatorController.getRaceSchedule);
router.get('/race-rounds/:raceRoundId/live', authMiddleware, authSpectator, SpectatorController.getLiveRaceDetail);
router.get('/race-rounds/:raceRoundId/result', authMiddleware, authSpectator, SpectatorController.getRaceResult);
router.get('/race-rounds/:raceRoundId/leaderboard', authMiddleware, authSpectator, SpectatorController.getRaceLeaderboard);
router.get('/race-rounds/:raceRoundId/prediction-methods', authMiddleware, authSpectator, SpectatorController.getAvailablePredictionMethods);

// Tournaments available for champion prediction (scheduled + ongoing)
router.get('/tournaments', authMiddleware, authSpectator, SpectatorController.getTournamentsForPrediction);

// All active prediction methods (optionally filtered by raceRoundId query param)
router.get('/prediction-methods', authMiddleware, authSpectator, SpectatorController.getAvailablePredictionMethods);

// Protected routes - predictions
router.post('/predictions', authMiddleware, authSpectator, SpectatorController.createPrediction);
router.get('/predictions', authMiddleware, authSpectator, SpectatorController.getMyPredictions);
router.get('/predictions/:predictionId', authMiddleware, authSpectator, SpectatorController.getPredictionDetail);

// Public - create spectator profile (wildcard LAST to avoid catching specific routes above)
router.post('/:uid', SpectatorController.createSpectator);

module.exports = router;
